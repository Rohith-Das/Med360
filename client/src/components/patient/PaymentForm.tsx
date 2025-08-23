import {
  useElements,
  useStripe,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { useState } from 'react';
import { CheckCircle,AlertCircle } from 'lucide-react';



function PaymentForm() {
    const stripe=useStripe()
    const element=useElements()
      const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);


  return (
     <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-white text-xl font-semibold">Secure Payment</h2>
          <p className="text-blue-100 text-sm mt-1">Your transaction is secured with SSL encryption</p>
        </div>

        <form  className="p-6">
          <div className="mb-6 rounded-md bg-white p-4 shadow-sm border border-gray-100">
            <PaymentElement />
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`w-full rounded-md px-4 py-3 font-medium text-white transition-all 
              ${isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }`}
          >
            <div className="flex items-center justify-center">
              {isProcessing && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isProcessing ? 'Processing payment...' : 'Pay Now'}</span>
            </div>
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-md flex items-center text-sm
              ${status.includes('failed') 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'}`}
            >
              {status.includes('failed') ? (
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              )}
              {status}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center space-x-3">
            <div className="h-8 w-auto">
              <svg className="h-full w-auto" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#16366F" width="36" height="24" rx="4" />
                <path d="M14.5 11.2v4h-1.3V8.8h2.4c1.5 0 2.5 0.8 2.5 2 0 0.9-0.7 1.6-1.5 1.8l2.2 2.5h-1.6l-1.9-2.3h-0.8z M14.5 10h1c0.8 0 1.3-0.3 1.3-1s-0.5-1-1.3-1h-1v2z" fill="white" />
                <path d="M19 15.2V8.8h3.8v1.2h-2.5v1.3h2.4v1.2h-2.4v1.4h2.5v1.2H19z" fill="white" />
              </svg>
            </div>
            <div className="h-6 w-auto">
              <svg className="h-full w-auto" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#F7F7F7" width="36" height="24" rx="4" />
                <path d="M13 9h5v9h-5zM23 12c0-1.7-1.3-3-3-3h-7v9h2v-3h2v3h2c1.7 0 3.3-1.3 3.3-3s-1.3-3-3-3z" fill="#EB001B" />
                <path d="M23 12h-3v3h3c0-1.7 0-3 0-3z" fill="#F79E1B" />
              </svg>
            </div>
            <div className="h-6 w-auto">
              <svg className="h-full w-auto" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#F7F7F7" width="38" height="24" rx="4" />
                <path d="M16 9l-1.2 7h1.9l1.2-7h-1.9zM11.5 16l-0.8-2.2-0.5 2.2H8l-0.4-7h2l0.3 4.5 1.1-3.2h1.1l0.2 3.2 1-4.5h1.9l-2 7h-1.7zM27.3 16L26 9h-1.7l-2.4 7h1.9l0.3-1h2.1l0.2 1h1.9z M24.6 13.7l0.5-2.9 0.5 2.9h-1z" fill="#2566AF" />
              </svg>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            By clicking "Pay Now", you agree to our terms and privacy policy.
          </p>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm