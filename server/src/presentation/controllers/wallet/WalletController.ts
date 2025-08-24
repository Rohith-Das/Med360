// src/presentation/controllers/wallet/WalletController.ts
import { Response } from 'express';
import { container } from 'tsyringe';
import { AuthRequest } from '../../middlewares/AuthRequest';
import { GetWalletBalanceUC } from '../../../application/payment/GetWalletBalanceUC';
import { GetTransactionHistoryUC } from '../../../application/payment/GetWalletBalanceUC';

export class WalletController {
  async getWalletBalance(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const patientId = req.user?.userId;

      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getWalletBalanceUC = container.resolve(GetWalletBalanceUC);
      const wallet = await getWalletBalanceUC.execute(patientId);

      return res.status(200).json({
        success: true,
        message: 'Wallet balance retrieved successfully',
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          isActive: wallet.isActive
        }
      });
    } catch (error: any) {
      console.error('Get wallet balance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve wallet balance',
      });
    }
  }

  async getTransactionHistory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const patientId = req.user?.userId;

      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getTransactionHistoryUC = container.resolve(GetTransactionHistoryUC);
      const transactions = await getTransactionHistoryUC.execute(patientId);

      return res.status(200).json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: transactions
      });
    } catch (error: any) {
      console.error('Get transaction history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve transaction history',
      });
    }
  }

}