import { inject, injectable } from 'tsyringe';
import { IWalletRepository } from '../../domain/repositories/WalletRepository';
import { Wallet } from '../../domain/entities/Wallet.entity';

@injectable()
export class GetWalletBalanceUC {
  constructor(
   @inject('IWalletRepository') 
    private walletRepository: IWalletRepository
  ) {}

  async execute(patientId: string): Promise<Wallet> {
    try {
      let wallet = await this.walletRepository.findByPatientId(patientId);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await this.walletRepository.createWallet({
          patientId,
          balance: 0,
          currency: 'inr',
          isActive: true
        });
      }

      return wallet;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get wallet balance');
    }
  }
}

@injectable()
export class GetTransactionHistoryUC {
  constructor(
   @inject('IWalletRepository') 
    private walletRepository: IWalletRepository
  ) {}

  async execute(patientId: string) {
    try {
      const transactions = await this.walletRepository.getTransactionHistory(patientId);
      return transactions;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get transaction history');
    }
  }
}