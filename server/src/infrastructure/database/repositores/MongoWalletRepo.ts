import { injectable } from "tsyringe";
import { IWalletRepository } from "../../../domain/repositories/WalletRepository";
import { Wallet,WalletTransaction } from "../../../domain/entities/Wallet.entity";
import { WalletModel,WalletTransactionModel } from "../models/WalletModel";

@injectable()

export class MongoWalletRepo implements IWalletRepository{
    async createWallet(wallet: Omit<Wallet, "id">): Promise<Wallet> {
        const newWallet= new WalletModel(wallet)
        const saved=await newWallet.save()
        return{
            ...saved.toObject(),
            id:saved._id.toString()
        }
    }
    async findByPatientId(patientId: string): Promise<Wallet | null> {
        const wallet=await WalletModel.findOne({patientId});
        if(!wallet) return null;
        return{
            ...wallet.toObject(),
            id:wallet._id.toString()
        }
    }
    async updateBalance(walletId: string, amount: number, type: "credit" | "debit"): Promise<Wallet | null> {
        const updateAmount=type ==='credit'?amount:-amount;
        const updated=await WalletModel.findByIdAndUpdate(
            walletId,
            {$inc:{balance:updateAmount}},
            {new:true}
        )
        if(!updated) return null

        return {
            ...updated.toObject(),
            id:updated._id.toString()
        }
    }
    async addTransaction(transaction: Omit<WalletTransaction, "id">): Promise<WalletTransaction> {
        const newTransaction=new WalletTransactionModel(transaction);
        const saved=await newTransaction.save()
        return{
            ...saved.toObject(),
            id:saved._id.toString(),
        }
    }
    async getTransactionHistory(patientId: string): Promise<WalletTransaction[]> {
        const transactions=await WalletTransactionModel.find({patientId})
        .sort({createdAt: -1});
        return transactions.map(transaction =>({
            ...transaction.toObject(),
            id:transaction._id.toString()
        }))
    }
}