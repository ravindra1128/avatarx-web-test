import React from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const GiftCard = ({ giftData, onRedeem }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(giftData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="text-center">
        {/* Gift Card Header */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg">
            <Gift className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-black mb-2">🎉 Congratulations!</h3>
        <p className="text-gray-600 mb-6">You've earned your monthly e-gift reward!</p>

        {/* Gift Card Details */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-black mb-2">{giftData.title}</h4>
            <p className="text-gray-600 text-sm">{giftData.description}</p>
          </div>

          {/* Gift Card Code */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gift Code</p>
                <p className="text-xl font-mono font-bold text-black tracking-wider">
                  {giftData.code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gift Card Value and Expiry */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Value</p>
              <p className="text-lg font-bold text-black">${giftData.value}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Expires</p>
              <p className="text-sm font-medium text-black">
                {formatExpiryDate(giftData.expiryDate)}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h5 className="font-semibold text-black mb-2">How to use:</h5>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Copy the gift code above</li>
              <li>2. Visit {giftData.merchant} website</li>
              <li>3. Add items to your cart</li>
              <li>4. Apply the code at checkout</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => window.open(giftData.merchantUrl, '_blank')}
              className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Visit {giftData.merchant}
            </button>
            <button
              onClick={onRedeem}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Mark as Used
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCard;
