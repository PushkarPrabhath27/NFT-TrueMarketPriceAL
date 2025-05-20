import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('NFT TrustScore API Gateway is running');
});

export default router;
</write_to_file>
