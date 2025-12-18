import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Upload image (delivery proof or receipt)
router.post('/image', upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = req.user!;
    const { type = 'general' } = req.body; // 'delivery', 'receipt', 'general'

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dispatch/${type}`,
          resource_type: 'image',
          public_id: `${user.id}_${Date.now()}`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// Upload multiple images
router.post('/images', upload.array('images', 5), async (req: AuthRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const user = req.user!;
    const { type = 'general' } = req.body;

    const uploadPromises = (req.files as Express.Multer.File[]).map((file) => {
      return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `dispatch/${type}`,
            resource_type: 'image',
            public_id: `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    const urls = results.map(r => ({
      url: r.secure_url,
      publicId: r.public_id
    }));

    res.json({
      message: 'Images uploaded successfully',
      urls: results.map(r => r.secure_url),
      images: urls
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload images' });
  }
});

// Delete image
router.delete('/image/:publicId', async (req: AuthRequest, res) => {
  try {
    const { publicId } = req.params;

    // Decode public ID (may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);

    await cloudinary.uploader.destroy(decodedPublicId);

    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});

export default router;
