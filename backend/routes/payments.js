import express from 'express';
import { authenticate } from '../middleware/auth.js';
import CoinTransaction from '../models/CoinTransaction.js';
import User from '../models/User.js';

const router = express.Router();

// Simulate coin purchase (in production, integrate with actual payment gateway)
router.post('/purchase-coins', authenticate, async (req, res) => {
  try {
    console.log('🛒 Coin purchase request received:', { packageId: req.body.packageId, paymentMethod: req.body.paymentMethod, userId: req.user.id });
    const { packageId, paymentMethod, paymentDetails } = req.body;

    if (!packageId || !paymentMethod) {
      return res.status(400).json({ error: 'Package ID and payment method are required' });
    }

    // Define coin packages
    const packages = {
      'basic': { coins: 100, price: 99, currency: 'PHP', bonus: 0 },
      'popular': { coins: 250, price: 199, currency: 'PHP', bonus: 62 }, // 25% bonus
      'value': { coins: 500, price: 349, currency: 'PHP', bonus: 143 }, // 40% bonus
      'premium': { coins: 1000, price: 599, currency: 'PHP', bonus: 333 } // 50% bonus
    };

    const selectedPackage = packages[packageId];
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }

    // Validate payment method
    const validPaymentMethods = ['gcash', 'paymaya', 'grabpay', 'bank_transfer', 'credit_card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // In production, integrate with actual payment gateways:
    // - GCash API
    // - PayMaya API  
    // - GrabPay API
    // - Bank transfer verification
    // - Credit card processing (Stripe, etc.)

    // For now, simulate successful payment
    const paymentResult = await simulatePayment(selectedPackage, paymentMethod, paymentDetails);
    
    if (!paymentResult.success) {
      return res.status(400).json({ 
        error: 'Payment failed',
        details: paymentResult.message 
      });
    }

    // Create pending purchase request (awaiting admin approval)
    const totalCoins = selectedPackage.coins + selectedPackage.bonus;
    
    // Get user's current balance (without modifying it)
    const user = await User.findById(req.user.id);
    const currentBalance = user.coins.balance;
    console.log('💰 User balance before purchase:', currentBalance);
    
    // Create a pending transaction that doesn't affect balance
    const transaction = new CoinTransaction({
      user: req.user.id,
      type: 'purchase',
      amount: totalCoins,
      reason: 'coin_purchase_pending',
      description: `Purchase request: ${selectedPackage.coins} coins${selectedPackage.bonus ? ` + ${selectedPackage.bonus} bonus coins` : ''} via ${paymentMethod}`,
      status: 'pending', // Requires admin approval
      balanceBefore: currentBalance,
      balanceAfter: currentBalance, // No change to balance yet
      metadata: {
        packageId,
        paymentMethod,
        paymentId: paymentResult.paymentId,
        price: selectedPackage.price,
        currency: selectedPackage.currency,
        baseCoins: selectedPackage.coins,
        bonusCoins: selectedPackage.bonus
      }
    });

    await transaction.save();
    console.log('✅ Pending transaction created with ID:', transaction._id);

    // Balance remains unchanged
    const newBalance = currentBalance;
    console.log('💰 User balance after (should be unchanged):', newBalance);

    res.json({
      success: true,
      message: 'Purchase request submitted successfully! Your coins will be credited within 24 hours after payment verification.',
      transaction: {
        coinsPending: totalCoins,
        baseCoins: selectedPackage.coins,
        bonusCoins: selectedPackage.bonus,
        amountPaid: selectedPackage.price,
        currency: selectedPackage.currency,
        paymentMethod,
        paymentId: paymentResult.paymentId,
        status: 'pending',
        transactionId: transaction._id
      },
      newBalance, // Current balance (unchanged)
      receipt: {
        date: new Date().toISOString(),
        packageName: packageId,
        description: `Purchase Request: ${selectedPackage.coins} Tennis Marketplace Coins${selectedPackage.bonus ? ` + ${selectedPackage.bonus} bonus coins` : ''}`,
        amount: `₱${selectedPackage.price.toLocaleString()}`,
        status: 'Pending Admin Approval',
        note: 'Please contact 09175105185 to confirm your payment. Coins will be credited within 24 hours.'
      }
    });

  } catch (error) {
    console.error('Error purchasing coins:', error);
    res.status(500).json({ error: 'Failed to process coin purchase' });
  }
});

// Get payment methods available in Philippines
router.get('/payment-methods', (req, res) => {
  const paymentMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay with your GCash wallet',
      logo: '/images/payment/gcash.png',
      fees: 'No additional fees',
      processingTime: 'Instant',
      popular: true
    },
    {
      id: 'paymaya',
      name: 'PayMaya',
      description: 'Pay with your PayMaya account',
      logo: '/images/payment/paymaya.png',
      fees: 'No additional fees',
      processingTime: 'Instant',
      popular: true
    },
    {
      id: 'grabpay',
      name: 'GrabPay',
      description: 'Pay with your GrabPay wallet',
      logo: '/images/payment/grabpay.png',
      fees: 'No additional fees',
      processingTime: 'Instant',
      popular: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer from your Philippine bank account',
      logo: '/images/payment/bank.png',
      fees: 'Bank fees may apply',
      processingTime: '1-2 business days',
      popular: false
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or JCB',
      logo: '/images/payment/cards.png',
      fees: '3.5% processing fee',
      processingTime: 'Instant',
      popular: false
    }
  ];

  res.json({ paymentMethods });
});

// Get user's purchase history
router.get('/purchase-history', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const history = await CoinTransaction.getUserHistory(req.user.id, {
      page,
      limit,
      type: 'purchase'
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

// Simulate payment processing (replace with real payment gateway integration)
async function simulatePayment(packageInfo, paymentMethod, paymentDetails) {
  // Simulate different payment scenarios
  const random = Math.random();
  
  // 90% success rate for simulation
  if (random > 0.9) {
    const errorMessages = {
      'gcash': 'Insufficient GCash balance',
      'paymaya': 'PayMaya account suspended',
      'grabpay': 'GrabPay transaction limit exceeded',
      'bank_transfer': 'Invalid bank account details',
      'credit_card': 'Card declined by issuer'
    };

    return {
      success: false,
      message: errorMessages[paymentMethod] || 'Payment processing failed'
    };
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock payment ID
  const paymentId = `${paymentMethod.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    paymentId,
    message: 'Payment processed successfully'
  };
}

// Webhook endpoint for payment confirmations (for production use)
router.post('/webhook/:provider', express.raw({ type: 'application/json' }), async (req, res) => {
  const provider = req.params.provider;
  
  try {
    // Verify webhook signature based on provider
    // Each payment provider (GCash, PayMaya, etc.) has their own signature verification
    
    switch (provider) {
      case 'gcash':
        // Verify GCash webhook signature
        // Process GCash payment confirmation
        break;
        
      case 'paymaya':
        // Verify PayMaya webhook signature
        // Process PayMaya payment confirmation
        break;
        
      case 'grabpay':
        // Verify GrabPay webhook signature
        // Process GrabPay payment confirmation
        break;
        
      default:
        return res.status(400).json({ error: 'Unknown payment provider' });
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error(`Webhook error for ${provider}:`, error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;