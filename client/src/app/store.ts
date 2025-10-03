import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import adminAuthReducer from '../features/auth/adminAuthSlice'
import doctorAuthReducer from '../features/auth/doctorAuthSlice';
import doctorsReducer from '../features/Doctor/doctorSlice';
import adminDoctorsReducer from '../features/admin/DoctorMgtSlice'

import notificationReducer from '../features/notification/notificationSlice';
import chatReducer from '../features/chat/chatSlice';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import storage from "redux-persist/lib/storage"; 
import profileReducer  from '../features/profile/profileSlice';
import specializationReducer from '../features/specialization/specializationSlice';
import DoctorProfileReducer from '../features/profile/DoctorSlice'
const rootReducer=combineReducers({
    auth:authReducer,
    adminAuth:adminAuthReducer,
    profile: profileReducer,
    doctorProfile:DoctorProfileReducer,
     specialization: specializationReducer,
       doctorAuth: doctorAuthReducer,
       doctors:doctorsReducer,
       adminDoctors: adminDoctorsReducer,
       notifications: notificationReducer,
       chat:chatReducer,
         
})
const persistConfig={
    key:'root',
    storage,
    whitelist:['auth','adminAuth','profile','doctorAuth','doctorProfile','chat']
}

const persistedReducer=persistReducer(persistConfig,rootReducer);


export const store=configureStore({
    reducer:persistedReducer,
    middleware:(getDefaultMiddleware)=>
        getDefaultMiddleware({
            serializableCheck:{
                ignoredActions:[FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        })
})
export const persistor=persistStore(store);

export type RootState=ReturnType<typeof store.getState>;
export type AppDispatch=typeof store.dispatch;