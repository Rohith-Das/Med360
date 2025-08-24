import { Wallet,WalletTransaction } from "../entities/Wallet.entity";

export interface IWalletRepository{
    createWallet(wallet:Omit<Wallet,'id'>):Promise<Wallet>
     findByPatientId(patientId: string): Promise<Wallet | null>;
     updateBalance(walletId: string, amount: number, type: 'credit' | 'debit'): Promise<Wallet | null>;
      addTransaction(transaction: Omit<WalletTransaction, 'id'>): Promise<WalletTransaction>;
        getTransactionHistory(patientId: string): Promise<WalletTransaction[]>;
}