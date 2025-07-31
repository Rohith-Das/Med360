import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import adminAuthReducer from '../features/auth/adminAuthSlice'
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

const rootReducer=combineReducers({
    auth:authReducer,
    adminAuth:adminAuthReducer,
    profile: profileReducer,
     specialization: specializationReducer
})
const persistConfig={
    key:'root',
    storage,
    whitelist:['auth','adminAuth','profile']
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