import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Wallet, Check, AlertCircle, CreditCard, Loader2, XCircle } from 'lucide-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { phantomWallet } from '../utils/phantomWallet';
import { cachedFetch } from '../utils/apiCache';
import { resolveApiUrl } from '../config/api';
import { extractPricingPlans, normalizeLicense, selectDefaultPlan, MODEL_DEFAULT_THUMBNAIL } from '../utils/modelTransformers';
import { convertSolToLamports, formatLamports } from '../utils/currency';

const extractModelResponse = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.response)) {
      return data.response;
    }

    if (data.response && typeof data.response === 'object') {
      return [data.response];
    }

    const nestedWithResponse = Object.values(data).find(
      (value) => value && typeof value === 'object' && Array.isArray(value.response)
    );

    if (nestedWithResponse) {
      return nestedWithResponse.response;
    }

    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) {
      return firstArray;
    }

    return [data];
  }

  return [];
};

const coerceNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatTokenLimit = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B 토큰`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M 토큰`;
  }

  return `${value.toLocaleString()} 토큰`;
};

const MERCHANT_WALLET_ADDRESS = 'Ctsc4RLun5Rrv8pLSidD8cpYKWWdsT1sNUqpA7rv4YLN';
const SOLANA_ENDPOINT = 'https://api.devnet.solana.com';
const BACKEND_VERIFICATION_ENDPOINT = resolveApiUrl('/api/payments/verify');

export const Checkout = () => {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const checkoutState = location.state || {};
  const hasPreloadedModel = Boolean(checkoutState?.model);
  const planParam = searchParams.get('plan') || checkoutState.selectedPlanId || 'standard';
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [airdropStatus, setAirdropStatus] = useState('');
  const [modelLoading, setModelLoading] = useState(() => !hasPreloadedModel);
  const [modelError, setModelError] = useState('');
  const [modelData, setModelData] = useState(() => {
    if (!checkoutState?.model) {
      return null;
    }

    const pricingPlans = Array.isArray(checkoutState.pricingPlans)
      ? checkoutState.pricingPlans
      : (checkoutState.model.pricingPlans || []);

    return {
      id: checkoutState.model.id?.toString() || id?.toString(),
      name: checkoutState.model.name || 'Unknown Model',
      creator: checkoutState.model.creator || 'Unknown Creator',
      versionName: checkoutState.model.versionName || '1.0.0',
      thumbnail: checkoutState.model.thumbnail || `${MODEL_DEFAULT_THUMBNAIL}?auto=compress&cs=tinysrgb&w=100`,
      pricingPlans,
      licenseTags: checkoutState.licenseTags || checkoutState.model.licenseTags || [],
    };
  });
  const hasPricingPlans = Boolean(modelData?.pricingPlans?.length);
  const [selectedPlanId, setSelectedPlanId] = useState(() => checkoutState.selectedPlanId || planParam);

  const steps = [
    { number: 1, title: '지갑 연결', description: '결제를 위해 지갑을 연결하세요' },
    { number: 2, title: '세부 확인', description: '주문 내용을 확인하세요' },
    { number: 3, title: '서명/전송', description: '트랜잭션에 서명하여 결제를 완료하세요' }
  ];

  useEffect(() => {
    if (planParam && planParam !== selectedPlanId) {
      setSelectedPlanId(planParam);
    }
  }, [planParam, selectedPlanId]);

  useEffect(() => {
    let isCancelled = false;

    const loadModel = async () => {
      try {
        if (!hasPreloadedModel) {
          setModelLoading(true);
        }
        setModelError('');

        const apiUrl = resolveApiUrl(`/api/models?id=${id}`);
        const data = await cachedFetch(
          apiUrl,
          {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
          10 * 60 * 1000,
        );

        if (isCancelled) {
          return;
        }

        const models = extractModelResponse(data);
        const target = models.find(model => model.id?.toString() === id?.toString()) || models[0];

        if (!target) {
          throw new Error('모델 정보를 찾을 수 없습니다.');
        }

        const licenseInfo = normalizeLicense(target.license);
        const pricingPlansRaw = extractPricingPlans(target.pricing);
        const defaultPlan = selectDefaultPlan(pricingPlansRaw);
        const pricingPlans = (pricingPlansRaw.length > 0 ? pricingPlansRaw : [defaultPlan])
          .map(plan => ({
            ...plan,
            rights: plan.rights && plan.rights.length > 0
              ? plan.rights
              : (licenseInfo.labels.length > 0 ? licenseInfo.labels : ['권한 정보 미제공']),
          }));

        setModelData({
          id: target.id?.toString(),
          name: target.name || 'Unknown Model',
          creator: target.uploader || 'Unknown Creator',
          versionName: target.versionName || '1.0.0',
          thumbnail: target.thumbnail || `${MODEL_DEFAULT_THUMBNAIL}?auto=compress&cs=tinysrgb&w=100`,
          pricingPlans,
          licenseTags: licenseInfo.labels,
        });
      } catch (error) {
        if (!isCancelled) {
          console.error('Checkout model load error:', error);
          setModelError(error.message || '모델 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (!isCancelled) {
          setModelLoading(false);
        }
      }
    };

    if (hasPreloadedModel && hasPricingPlans) {
      setModelLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    loadModel();

    return () => {
      isCancelled = true;
    };
  }, [id, hasPreloadedModel, hasPricingPlans]);

  useEffect(() => {
    if (!modelData?.pricingPlans?.length) {
      return;
    }

    const availablePlans = modelData.pricingPlans.map(plan => plan.id);
    if (!availablePlans.includes(selectedPlanId)) {
      setSelectedPlanId(modelData.pricingPlans[0].id);
    }
  }, [modelData, selectedPlanId]);

  const selectedPlan = useMemo(() => {
    if (!modelData?.pricingPlans) return null;
    return modelData.pricingPlans.find(plan => plan.id === selectedPlanId) || modelData.pricingPlans[0] || null;
  }, [modelData, selectedPlanId]);

  const platformFeeLamports = convertSolToLamports(2.0);
  const networkFeeEstimateLamports = convertSolToLamports(1);
  const planPriceLamports = Number.isFinite(Number(selectedPlan?.price))
    ? convertSolToLamports(Number(selectedPlan.price))
    : 0;
  const totalLamports = planPriceLamports + platformFeeLamports + networkFeeEstimateLamports;
  const rights = selectedPlan?.rights?.length ? selectedPlan.rights : (modelData?.licenseTags || []);
  const planMetadata = selectedPlan?.metadata || {};

  const pricingPayload = useMemo(() => {
    if (!modelData?.pricingPlans?.length) {
      return {};
    }

    return modelData.pricingPlans.reduce((acc, plan) => {
      if (!plan?.id) {
        return acc;
      }

      const priceValue = coerceNumber(plan.price);
      const metadata = plan.metadata || {};
      const planRights = Array.isArray(plan.rights) && plan.rights.length > 0
        ? plan.rights
        : (modelData?.licenseTags && modelData.licenseTags.length > 0 ? modelData.licenseTags : []);

      const serializedPlan = {
        price: priceValue != null ? priceValue : 0,
        description: plan.name || plan.id,
        billingType: plan.billingType || '',
      };

      const tokenLimit = coerceNumber(metadata.monthlyTokenLimit);
      if (tokenLimit != null) {
        serializedPlan.monthlyTokenLimit = tokenLimit;
      }

      const generationLimit = coerceNumber(metadata.monthlyGenerationLimit);
      if (generationLimit != null) {
        serializedPlan.monthlyGenerationLimit = generationLimit;
      }

      const requestLimit = coerceNumber(metadata.monthlyRequestLimit);
      if (requestLimit != null) {
        serializedPlan.monthlyRequestLimit = requestLimit;
      }

      serializedPlan.rights = planRights;

      acc[plan.id] = serializedPlan;
      return acc;
    }, {});
  }, [modelData]);

  const canProceedToPayment = agreedToTerms && agreedToPrivacy && !!selectedPlan;
  const walletStatus = phantomWallet.getConnectionStatus();

  const connection = useMemo(() => new Connection(SOLANA_ENDPOINT, 'confirmed'), []);

  const handlePhantomConnect = async () => {
    try {
      console.log('🔗 Phantom 지갑 연결 시도 중...');
      setPaymentError('');
      setPaymentStatus('');
      setAirdropStatus('');
      setPaymentSuccess(false);
      setTransactionResult(null);
      await phantomWallet.connect();
      setSelectedWallet('phantom');
      setCurrentStep(2);
      console.log('✅ Phantom 지갑 연결 완료');
    } catch (error) {
      setPaymentError(error.message);
      console.error('Phantom 연결 실패:', error);
    }
  };

  const handlePayment = async () => {
    if (!canProceedToPayment) return;

    if (!modelData || !selectedPlan) {
      setPaymentError('결제에 필요한 모델 정보를 불러오지 못했습니다.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');
    setPaymentStatus('결제 준비 중...');
    setAirdropStatus('');
    setPaymentSuccess(false);
    setTransactionResult(null);
    setVerificationStatus('idle');

    try {
      // Step 1: 팬텀 지갑 제공자 확인
      console.log('🔍 Phantom provider 확인 중...');
      const provider = phantomWallet.provider || (window?.solana?.isPhantom ? window.solana : null);
      if (!provider) {
        throw new Error('팬텀 지갑이 감지되지 않았습니다. 설치 후 다시 시도해주세요.');
      }

      if (!provider.publicKey) {
        throw new Error('팬텀 지갑에 연결되지 않았습니다. 먼저 지갑을 연결해주세요.');
      }

      const userPublicKey = new PublicKey(provider.publicKey.toString());

      // Step 2: 사용자 잔액 확인 및 Devnet Airdrop
      console.log('💰 사용자 잔액 확인 중...');
      setPaymentStatus('지갑 잔액 확인 중...');
      const requiredLamports = totalLamports;
      const currentBalance = await connection.getBalance(userPublicKey);
      console.log(`현재 잔액: ${currentBalance} lamports`);

      if (currentBalance < requiredLamports) {
        console.log('💸 잔액 부족. Devnet Airdrop을 요청합니다.');
        setAirdropStatus(`잔액이 부족하여 Devnet Airdrop(${formatLamports(2 * LAMPORTS_PER_SOL)})을 요청합니다...`);
        const airdropSignature = await connection.requestAirdrop(userPublicKey, 2 * LAMPORTS_PER_SOL);
        const latestBlockhash = await connection.getLatestBlockhash();
        setAirdropStatus('Airdrop 완료 대기 중...');
        await connection.confirmTransaction({ signature: airdropSignature, ...latestBlockhash }, 'confirmed');
        console.log('✅ Airdrop 완료. 잔액 재확인 중...');
        const refreshedBalance = await connection.getBalance(userPublicKey);
        console.log(`에어드롭 후 잔액: ${refreshedBalance} lamports`);
        if (refreshedBalance < requiredLamports) {
          throw new Error('에어드롭 후에도 결제에 필요한 잔액이 부족합니다.');
        }
        setAirdropStatus('Airdrop 완료! 결제를 계속 진행합니다.');
      } else {
        setAirdropStatus('충분한 잔액이 확인되었습니다.');
      }

      // Step 3: 트랜잭션 생성
      console.log('🧾 트랜잭션 생성 중...');
      setPaymentStatus('트랜잭션을 준비하고 있습니다...');
      const merchantPublicKey = new PublicKey(MERCHANT_WALLET_ADDRESS);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        feePayer: userPublicKey,
        recentBlockhash: blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: merchantPublicKey,
          lamports: requiredLamports,
        })
      );

      // Step 4: 팬텀 지갑 서명
      console.log('✍️ Phantom 서명 대기 중...');
      setPaymentStatus('Phantom 지갑에서 트랜잭션 서명을 요청 중입니다...');
      let signedTransaction;
      try {
        signedTransaction = await provider.signTransaction(transaction);
      } catch (signatureError) {
        console.error('Phantom 서명 오류:', signatureError);
        if (signatureError?.code === 4001 || signatureError?.message?.toLowerCase?.().includes('user rejected')) {
          throw new Error('사용자가 트랜잭션 서명을 거부했습니다.');
        }
        throw new Error('트랜잭션 서명 중 오류가 발생했습니다.');
      }
      console.log('✅ 서명 완료. 트랜잭션 전송을 시작합니다.');

      // Step 5: Devnet 전송 및 확인
      console.log('🚀 트랜잭션 전송 중...');
      setPaymentStatus('트랜잭션을 Solana Devnet에 전송 중입니다...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log(`트랜잭션 시그니처: ${signature}`);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      console.log('✅ 트랜잭션이 Devnet에서 확인되었습니다.');

      // Step 6: 백엔드 검증 요청
      const orderDetails = {
        modelId: modelData.id,
        modelName: modelData.name,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amountLamports: requiredLamports,
        amountSol: requiredLamports / LAMPORTS_PER_SOL,
        currency: 'SOL',
      };

      const walletDetails = {
        publicKey: userPublicKey.toString(),
        network: 'devnet',
        provider: selectedWallet || 'phantom',
      };

      // Google 로그인 시 저장된 이메일/이름 정보에서 buyer 이름 추출
      let buyerName = walletDetails.publicKey;
      const storedUserRaw = localStorage.getItem('user');
      let storedEmail = '';
      let storedDisplayName = '';

      if (storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw);
          storedEmail = typeof storedUser?.email === 'string' ? storedUser.email : '';
          storedDisplayName = typeof storedUser?.name === 'string' ? storedUser.name : '';
        } catch (parseError) {
          console.warn('Failed to parse stored user for buyer info:', parseError);
        }
      }

      const googleEmail = storedEmail || localStorage.getItem('userEmail') || '';
      const emailPrefix = googleEmail.split('@')[0];
      const storedName = storedDisplayName || localStorage.getItem('userName') || '';

      if (emailPrefix) {
        buyerName = emailPrefix;
      } else if (storedName) {
        buyerName = storedName;
      }

      const verificationPayload = {
        id: modelData.id,
        name: modelData.name,
        buyer: buyerName,
        versionName: modelData.versionName || '1.0.0',
        plan: selectedPlan.id,
        pricing: selectedPlan?.id && pricingPayload[selectedPlan.id]
          ? { [selectedPlan.id]: pricingPayload[selectedPlan.id] }
          : pricingPayload,
        onchainTx: signature,
      };

      console.log('⏳ 백엔드 검증 시작:');
      console.log('📤 백엔드로 전송할 데이터:');
      console.log(JSON.stringify(verificationPayload, null, 2));

      setTransactionResult({
        transactionSignature: signature,
        order: orderDetails,
        wallet: walletDetails,
        backend: {
          endpoint: BACKEND_VERIFICATION_ENDPOINT,
          payload: verificationPayload,
        },
        verification: {
          status: 'PENDING',
          message: '백엔드 검증 대기 중입니다.',
          timestamp: Date.now(),
        },
      });

      setVerificationStatus('pending');
      setPaymentSuccess(true);
      setPaymentStatus('트랜잭션이 완료되었습니다. 백엔드 검증 중입니다.');

      // 백엔드 검증 요청
      try {
        console.log('🔄 백엔드 검증 요청 시작...');
        setPaymentStatus('백엔드에서 결제를 검증 중입니다...');
        
        // 1분 타임아웃 설정
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('백엔드 검증 요청 시간 초과 (60초)'));
          }, 60 * 1000);
        });

        const fetchPromise = fetch(BACKEND_VERIFICATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(verificationPayload),
        });

        const verificationResponse = await Promise.race([fetchPromise, timeoutPromise]);

        if (!verificationResponse.ok) {
          const errorData = await verificationResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `백엔드 검증 실패: ${verificationResponse.status} ${verificationResponse.statusText}`
          );
        }

        const verificationData = await verificationResponse.json();
        console.log('✅ 백엔드 검증 응답:', verificationData);

        if (!verificationData?.success) {
          const failureStatus = verificationData?.status || 'FAILED';
          const failureMessage =
            verificationData?.message ||
            (failureStatus === 'FAILED'
              ? '백엔드 검증에서 결제가 실패했습니다.'
              : `백엔드 검증 실패: ${failureStatus}`);

          setVerificationStatus('failed');
          setPaymentStatus('백엔드 검증이 실패했습니다.');
          setTransactionResult((prev) => {
            const existingResult = prev || {};
            const previousVerification = existingResult.verification || {};

            return {
              ...existingResult,
              verification: {
                ...previousVerification,
                status: failureStatus,
                message: failureMessage,
                failedAt: Date.now(),
                backendResponse: verificationData,
              },
            };
          });
          setPaymentError(failureMessage);
          return;
        }

        // 검증 완료 상태로 업데이트
        setVerificationStatus('completed');
        setPaymentStatus('백엔드 검증이 완료되었습니다.');
        setPaymentError('');
        setTransactionResult((prev) => {
          const existingResult = prev || {};
          const previousVerification = existingResult.verification || {};

          return {
            ...existingResult,
            verification: {
              ...previousVerification,
              status: 'COMPLETED',
              message: '백엔드 검증이 완료되었습니다.',
              completedAt: Date.now(),
              backendResponse: verificationData,
            },
          };
        });

      } catch (verificationError) {
        console.error('❌ 백엔드 검증 오류:', verificationError);
        setVerificationStatus('failed');
        setPaymentStatus('백엔드 검증 중 오류가 발생했습니다.');
        setTransactionResult((prev) => {
          const existingResult = prev || {};
          const previousVerification = existingResult.verification || {};

          return {
            ...existingResult,
            verification: {
              ...previousVerification,
              status: 'FAILED',
              message: verificationError.message || '백엔드 검증 중 오류가 발생했습니다.',
              failedAt: Date.now(),
              error: verificationError.message,
            },
          };
        });

        setPaymentError(verificationError.message || '백엔드 검증 중 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentError(error.message || '결제 처리 중 오류가 발생했습니다.');
      setPaymentStatus('결제가 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleManualVerificationComplete = () => {
    if (!paymentSuccess || verificationStatus !== 'pending') {
      return;
    }

    console.log('✅ 수동 검증 완료 처리 진행 중...');
    setVerificationStatus('completed');
    setPaymentStatus('백엔드 검증이 완료되었습니다.');
    setTransactionResult((prev) => {
      const existingResult = prev || {};
      const previousVerification = existingResult.verification || {};

      return {
        ...existingResult,
        verification: {
          ...previousVerification,
          status: 'COMPLETED_MANUAL',
          message: '사용자에 의해 검증이 완료되었습니다.',
          completedAt: Date.now(),
        },
      };
    });
  };

  const handleRetryVerification = async () => {
    if (!paymentSuccess || verificationLoading || verificationStatus !== 'failed') {
      return;
    }

    const endpoint = transactionResult?.backend?.endpoint || BACKEND_VERIFICATION_ENDPOINT;
    const payload = transactionResult?.backend?.payload;

    if (!payload || !endpoint) {
      setPaymentError('재검증에 필요한 정보가 부족합니다.');
      return;
    }

    try {
      setVerificationLoading(true);
      setPaymentError('');
      setPaymentStatus('백엔드에 재검증을 요청하고 있습니다...');
      setVerificationStatus('pending');
      setTransactionResult((prev) => {
        const existingResult = prev || {};
        const previousVerification = existingResult.verification || {};

        return {
          ...existingResult,
          verification: {
            ...previousVerification,
            status: 'PENDING_RETRY',
            message: '백엔드 재검증을 요청 중입니다.',
            retriedAt: Date.now(),
          },
        };
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('백엔드 재검증 요청 시간 초과 (60초)'));
        }, 60 * 1000);
      });

      const fetchPromise = fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const verificationResponse = await Promise.race([fetchPromise, timeoutPromise]);

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || `백엔드 검증 실패: ${verificationResponse.status} ${verificationResponse.statusText}`
        );
      }

      const verificationData = await verificationResponse.json();
      console.log('✅ 백엔드 재검증 응답:', verificationData);

      if (!verificationData?.success) {
        const failureStatus = verificationData?.status || 'FAILED';
        const failureMessage =
          verificationData?.message ||
          (failureStatus === 'FAILED'
            ? '백엔드 검증에서 결제가 실패했습니다.'
            : `백엔드 검증 실패: ${failureStatus}`);

        setVerificationStatus('failed');
        setPaymentStatus('백엔드 검증이 실패했습니다.');
        setTransactionResult((prev) => {
          const existingResult = prev || {};
          const previousVerification = existingResult.verification || {};

          return {
            ...existingResult,
            verification: {
              ...previousVerification,
              status: failureStatus,
              message: failureMessage,
              failedAt: Date.now(),
              backendResponse: verificationData,
            },
          };
        });
        setPaymentError(failureMessage);
        return;
      }

      setVerificationStatus('completed');
      setPaymentStatus('백엔드 재검증이 완료되었습니다.');
      setPaymentError('');
      setTransactionResult((prev) => {
        const existingResult = prev || {};
        const previousVerification = existingResult.verification || {};

        return {
          ...existingResult,
          verification: {
            ...previousVerification,
            status: 'COMPLETED_RETRY',
            message: '백엔드 재검증이 완료되었습니다.',
            completedAt: Date.now(),
            backendResponse: verificationData,
          },
        };
      });
    } catch (error) {
      console.error('❌ 백엔드 재검증 오류:', error);
      setVerificationStatus('failed');
      setPaymentStatus('백엔드 재검증 중 오류가 발생했습니다.');
      setPaymentError(error.message || '백엔드 재검증 중 오류가 발생했습니다.');
      setTransactionResult((prev) => {
        const existingResult = prev || {};
        const previousVerification = existingResult.verification || {};

        return {
          ...existingResult,
          verification: {
            ...previousVerification,
            status: 'FAILED_RETRY',
            message: error.message || '백엔드 재검증 중 오류가 발생했습니다.',
            failedAt: Date.now(),
          },
        };
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const tokenLimitValue = coerceNumber(planMetadata?.monthlyTokenLimit);
  const generationLimitValue = coerceNumber(planMetadata?.monthlyGenerationLimit);
  const requestLimitValue = coerceNumber(planMetadata?.monthlyRequestLimit);

  const tokenLimitLabel = tokenLimitValue != null ? formatTokenLimit(tokenLimitValue) : null;
  const generationLimitLabel = generationLimitValue != null ? `${generationLimitValue.toLocaleString()} 회` : null;
  const requestLimitLabel = requestLimitValue != null ? `${requestLimitValue.toLocaleString()} 회` : null;
  const isVerificationCompleted = verificationStatus === 'completed';
  const isVerificationFailed = verificationStatus === 'failed';

  return (
    <div className="flex-1 max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">결제</h1>
        <p className="text-gray-600 mt-2">모델 라이선스 구매를 완료하세요</p>
        {modelError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{modelError}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary - Left */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">주문 요약</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <img
                  src={modelData?.thumbnail || `${MODEL_DEFAULT_THUMBNAIL}?auto=compress&cs=tinysrgb&w=100`}
                  alt={modelData?.name || 'Model thumbnail'}
                  className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {modelLoading ? '모델 불러오는 중...' : modelData?.name || '모델 정보 없음'}
                  </h3>
                  <p className="text-sm text-gray-600">{modelData?.creator || '제공자 정보 없음'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">플랜</span>
                  <span className="text-sm font-medium">
                    {selectedPlan?.name || '플랜 정보 없음'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">라이선스 비용</span>
                  <span className="text-sm font-medium">
                    {planPriceLamports === 0 ? '무료' : formatLamports(planPriceLamports)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">플랫폼 수수료</span>
                  <span className="text-sm font-medium">{formatLamports(platformFeeLamports)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">네트워크 수수료</span>
                  <span className="text-sm font-medium">~{formatLamports(networkFeeEstimateLamports)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">총액</span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatLamports(totalLamports)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">포함된 권리</h4>
              {rights && rights.length > 0 ? (
                rights.map(right => (
                  <div key={right} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{right}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">권리 정보가 제공되지 않았습니다.</p>
              )}
            </div>

            {/* Access Pass Preview */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">발급 예정 Access Pass</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>만료:</span>
                  <span>{planMetadata?.expiryDays ? `${planMetadata.expiryDays}일` : '30일'}</span>
                </div>
                <div className="flex justify-between">
                  <span>사용 한도:</span>
                  <span>{tokenLimitLabel || '1M 토큰'}</span>
                </div>
                {(generationLimitLabel || requestLimitLabel) && (
                  <div className="flex justify-between">
                    <span>월 사용량:</span>
                    <span>
                      {[generationLimitLabel, requestLimitLabel]
                        .filter(Boolean)
                        .join(' / ') || '-'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Steps - Right */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step.number === currentStep
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : step.number < currentStep
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {step.number < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-20 h-0.5 mx-4 transition-colors ${
                        step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {steps[currentStep - 1].title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {steps[currentStep - 1].description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-80">
              {currentStep === 1 && (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">팬텀 지갑 연결</h4>
                  <p className="text-gray-600 mb-8">Solana 기반 결제를 위해 팬텀 지갑을 연결해주세요</p>

                  {paymentError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{paymentError}</p>
                    </div>
                  )}

                  <div className="max-w-md mx-auto">
                    <button
                      onClick={handlePhantomConnect}
                      className="flex items-center justify-center space-x-3 w-full p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      <span className="text-2xl">👻</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Phantom Wallet</div>
                        <div className="text-sm text-gray-600">Solana 지갑 연결</div>
                      </div>
                    </button>

                    {!phantomWallet.isPhantomInstalled() && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          팬텀 지갑이 설치되지 않았습니다.
                          <a
                            href="https://phantom.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-900 underline ml-1"
                          >
                            여기서 설치
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">지갑 연결됨</h4>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Phantom Wallet - {walletStatus.publicKey?.slice(0, 4)}...{walletStatus.publicKey?.slice(-4)} (Solana Devnet)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">약관 동의</h4>
                    <div className="space-y-3">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">이용약관</span>에 동의합니다
                          <button className="text-blue-600 hover:text-blue-700 ml-1">
                            (전문 보기)
                          </button>
                        </div>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={agreedToPrivacy}
                          onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">개인정보 처리방침</span>에 동의합니다
                          <button className="text-blue-600 hover:text-blue-700 ml-1">
                            (전문 보기)
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToPayment}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    결제 진행
                  </button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center py-8">
                  {paymentSuccess ? (
                    <div>
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                          isVerificationCompleted
                            ? 'bg-green-100'
                            : isVerificationFailed
                              ? 'bg-red-100'
                              : 'bg-yellow-100'
                        }`}
                      >
                        {isVerificationCompleted ? (
                          <Check className="h-8 w-8 text-green-600" />
                        ) : isVerificationFailed ? (
                          <XCircle className="h-8 w-8 text-red-600" />
                        ) : (
                          <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {isVerificationCompleted
                          ? '결제 검증 완료!'
                          : isVerificationFailed
                            ? '결제 검증 실패'
                            : '트랜잭션 완료'}
                      </h4>
                      <p className="text-gray-600 mb-6">
                        {isVerificationCompleted
                          ? '백엔드 검증이 완료되어 결제가 확정되었습니다.'
                          : isVerificationFailed
                            ? '백엔드 검증에서 결제가 실패했습니다. 자세한 내용은 아래 정보를 확인하세요.'
                            : 'Solana Devnet에서 트랜잭션이 확인되었습니다. 검증 완료 후 결제가 확정됩니다.'}
                      </p>

                      {transactionResult && (
                        <div
                          className={`rounded-lg p-4 mb-6 text-left ${
                            verificationStatus === 'completed'
                              ? 'bg-green-50 text-green-800'
                              : 'bg-yellow-50 text-yellow-800'
                          }`}
                        >
                          <div className="text-sm space-y-2">
                            {transactionResult.transactionSignature && (
                              <div className="flex flex-col">
                                <span className="font-medium">트랜잭션 해시</span>
                                <code className="font-mono break-all">{transactionResult.transactionSignature}</code>
                              </div>
                            )}
                            {transactionResult.order?.planName && (
                              <div className="flex flex-col">
                                <span className="font-medium">선택한 플랜</span>
                                <span>{transactionResult.order.planName}</span>
                              </div>
                            )}
                            {transactionResult.order?.amountLamports != null && (
                              <div className="flex flex-col">
                                <span className="font-medium">결제 금액</span>
                                <span>
                                  {formatLamports(transactionResult.order.amountLamports)}{' '}
                                  {transactionResult.order?.amountSol != null &&
                                    `(${transactionResult.order.amountSol.toFixed(4)} SOL)`}
                                </span>
                              </div>
                            )}
                            {transactionResult.wallet?.publicKey && (
                              <div className="flex flex-col">
                                <span className="font-medium">지갑 주소</span>
                                <code className="font-mono break-all">{transactionResult.wallet.publicKey}</code>
                              </div>
                            )}
                            {transactionResult.verification?.status && (
                              <div className="flex flex-col">
                                <span className="font-medium">검증 상태</span>
                                <span>
                                  {isVerificationCompleted
                                    ? '검증 완료'
                                    : isVerificationFailed
                                      ? '검증 실패'
                                      : '검증 대기중'}
                                </span>
                              </div>
                            )}
                            {transactionResult.verification?.message && (
                              <p className="text-sm">{transactionResult.verification.message}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {verificationStatus === 'pending' && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                          <p className="text-sm text-yellow-800">
                            현재 결제는 검증 대기 중입니다. 아래 버튼을 눌러 검증을 완료해주세요.
                          </p>
                          <button
                            onClick={handleManualVerificationComplete}
                            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                          >
                            검증 완료
                          </button>
                          <p className="mt-2 text-xs text-yellow-700">
                            추후에는 자동으로 백엔드 검증이 진행될 예정입니다.
                          </p>
                        </div>
                      )}

                      {verificationStatus === 'completed' && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                          <p className="text-sm text-green-800">검증이 완료되어 결제가 확정되었습니다.</p>
                        </div>
                      )}

                      {verificationStatus === 'failed' && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                          <p className="text-sm text-red-800">
                            백엔드 검증에서 실패 응답을 받았습니다. 문제가 계속되면 관리자에게 문의해주세요.
                          </p>
                          {transactionResult?.verification?.message && (
                            <p className="mt-2 text-xs text-red-700">{transactionResult.verification.message}</p>
                          )}
                          <button
                            onClick={handleRetryVerification}
                            disabled={verificationLoading}
                            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                          >
                            {verificationLoading ? '재검증 요청 중...' : '재검증 요청'}
                          </button>
                          <p className="mt-2 text-xs text-red-600">
                            동일한 트랜잭션으로 백엔드 검증을 다시 요청합니다.
                          </p>
                        </div>
                      )}

                      {(airdropStatus || paymentStatus) && (
                        <div className="space-y-2 mb-6">
                          {airdropStatus && (
                            <p className="text-sm text-blue-600">{airdropStatus}</p>
                          )}
                          {paymentStatus && (
                            <p className="text-sm text-blue-600">{paymentStatus}</p>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-gray-600">
                        {verificationStatus === 'completed'
                          ? '이제 모델 사용 권한을 확인하실 수 있습니다.'
                          : '검증이 완료되면 모델 사용 권한이 활성화됩니다.'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        {paymentLoading ? (
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        ) : (
                          <CreditCard className="h-8 w-8 text-blue-600" />
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {paymentLoading ? '결제 처리 중...' : '결제 승인'}
                      </h4>
                      <p className="text-gray-600 mb-8">
                        {paymentLoading ? '팬텀 지갑에서 트랜잭션을 확인하고 서명해주세요' : '아래 버튼을 클릭하여 결제를 진행하세요'}
                      </p>

                      {paymentError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">{paymentError}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>수신자:</span>
                            <span className="font-mono">{MERCHANT_WALLET_ADDRESS}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>금액:</span>
                            <span className="font-medium">{formatLamports(totalLamports)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>네트워크:</span>
                            <span>Solana Devnet</span>
                          </div>
                        </div>
                      </div>

                      {(airdropStatus || paymentStatus) && (
                        <div className="space-y-2 mb-6">
                          {airdropStatus && (
                            <p className="text-sm text-blue-600">{airdropStatus}</p>
                          )}
                          {paymentStatus && (
                            <p className="text-sm text-blue-600">{paymentStatus}</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handlePayment}
                        disabled={paymentLoading}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>처리 중...</span>
                          </>
                        ) : (
                          <span>결제 승인</span>
                        )}
                      </button>

                      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            결제 완료 후 Access Pass가 발급되어 즉시 모델 사용이 가능합니다
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
