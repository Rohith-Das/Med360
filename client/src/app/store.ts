// client/src/app/store.ts
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
import profileReducer from '../features/profile/profileSlice';
import specializationReducer from '../features/specialization/specializationSlice';
import DoctorProfileReducer from '../features/profile/DoctorSlice'

const patientPersistConfig={
  key:'patientAuth',
  storage,
  whitelist: ['auth', 'profile'],
}
const doctorPersistConfig = {
  key: 'doctorAuth', 
  storage,
  whitelist: ['doctorAuth', 'doctorProfile'], 
};
const adminPersistConfig = {
  key: 'adminAuth', 
  storage,
  whitelist: ['adminAuth'], 
};

const persistedPatientAuthReducer=persistReducer(patientPersistConfig,combineReducers({
  auth:authReducer,
  profile:profileReducer
}))
const persistedDoctorAuthReducer = persistReducer(doctorPersistConfig, combineReducers({
  doctorAuth: doctorAuthReducer,
  doctorProfile: DoctorProfileReducer,
}));

const persistedAdminAuthReducer = persistReducer(adminPersistConfig, combineReducers({
  adminAuth: adminAuthReducer,
}));

const rootReducer=combineReducers({
  patientAuth:persistedPatientAuthReducer,
  doctorAuth:persistedDoctorAuthReducer,
  adminAuth:persistedAdminAuthReducer,

  specialization: specializationReducer,
  doctors: doctorsReducer,
  adminDoctors: adminDoctorsReducer,
  notifications: notificationReducer,
  chat: chatReducer,

  
})
const rootPersistConfig = {
  key: 'appRoot', 
  storage,
  whitelist: ['specialization', 'doctors', 'adminDoctors', 'notifications', 'chat'], // Only global, non-auth slices
  blacklist: ['videoCall', 'patientAuth', 'doctorAuth', 'adminAuth'],
  // blacklist: ['patientAuth', 'doctorAuth', 'adminAuth'], // The nested reducers handle persistence for auth
};
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedRootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
        // No need to ignore paths anymore since we're using plain objects
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;