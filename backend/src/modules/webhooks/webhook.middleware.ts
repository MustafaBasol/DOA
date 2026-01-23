import { Request, Response, NextFunction } from 'express';
import { n8nConfig } from '../../config';

export function verifyN8nWebhook(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-n8n-secret'];

  if (!n8nConfig.webhookSecret) {
    console.error('❌ N8N_WEBHOOK_SECRET not set in environment - blocking request');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  if (secret !== n8nConfig.webhookSecret) {
    res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
    return;
  }

  // Optional: IP whitelist check
  if (n8nConfig.ipWhitelist.length > 0) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.socket.remoteAddress 
      || '';
    const isAllowed = n8nConfig.ipWhitelist.some(ip => clientIp.includes(ip));
    
    if (!isAllowed) {
      console.warn(`⚠️  Webhook request from unauthorized IP: ${clientIp}`);
      res.status(403).json({ error: 'Forbidden: IP not whitelisted' });
      return;
    }
  }

  next();
}
