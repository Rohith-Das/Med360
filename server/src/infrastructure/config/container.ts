import { container, injectable } from "tsyringe";
import {IPatientRepository} from '../../domain/repositories/patientRepository_method'
import { MongoPatientRepository } from "../database/repositores/MongoPatientRepository";
import { mongoDBClient } from "../database/mongoDB/mongoDBClient";


//db
container.registerSingleton(mongoDBClient)
//Repo
container.register<IPatientRepository>('IPatientRepository',MongoPatientRepository)
//use case
