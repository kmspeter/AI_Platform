import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Wallet, Check, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { phantomWallet } from '../utils/phantomWallet';
import { cachedFetch } from '../utils/apiCache';
import { resolveApiUrl } from '../config/api';
import { extractPricingPlans, normalizeLicense, selectDefaultPlan } from '../utils/modelTransformers';

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

export const Checkout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan') || 'standard';
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState('');
  const [modelData, setModelData] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(planParam);

  const steps = [
    { number: 1, title: '지갑 연결', description: '결제를 위해 지갑을 연결하세요' },
    { number: 2, title: '세부 확인', description: '주문 내용을 확인하세요' },
    { number: 3, title: '서명/전송', description: '트랜잭션에 서명하여 결제를 완료하세요' }
  ];

  useEffect(() => {
    setSelectedPlanId(planParam);
  }, [planParam]);

  useEffect(() => {
    let isCancelled = false;

    const loadModel = async () => {
      try {
        setModelLoading(true);
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

    loadModel();

    return () => {
      isCancelled = true;
    };
  }, [id]);

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

  const platformFee = 2.0;
  const networkFeeEstimate = 0.5;
  const planPrice = Number.isFinite(selectedPlan?.price) ? Number(selectedPlan.price) : 0;
  const totalAmount = planPrice + platformFee + networkFeeEstimate;
  const rights = selectedPlan?.rights?.length ? selectedPlan.rights : (modelData?.licenseTags || []);
  const planMetadata = selectedPlan?.metadata || {};

  const canProceedToPayment = agreedToTerms && agreedToPrivacy && !!selectedPlan;

  const handlePhantomConnect = async () => {
    try {
      setPaymentError('');
      await phantomWallet.connect();
      setSelectedWallet('phantom');
      setCurrentStep(2);
    } catch (error) {
      setPaymentError(error.message);
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

    try {
      // 1. 결제 데이터 준비
      const paymentData = {
        modelId: modelData.id,
        modelName: modelData.name,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: totalAmount,
        currency: 'SOL',
        subtotal: planPrice,
        fees: {
          platform: platformFee,
          network: networkFeeEstimate,
        },
        timestamp: Date.now(),
        recipient: '0xModelHub...' // 실제 환경에서는 백엔드에서 제공
      };

      // 2. 팬텀 지갑으로 트랜잭션 서명
      console.log('Requesting transaction signature...');
      const signedTransaction = await phantomWallet.signTransaction(paymentData);

      console.log('✅ Transaction signed successfully!');

      // 3. 백엔드로 전송될 데이터 출력
      const backendPayload = {
        transaction: {
          signature: signedTransaction.signature,
          publicKey: signedTransaction.publicKey,
          message: signedTransaction.message,
        },
        order: {
          model: {
            id: modelData.id,
            name: modelData.name,
            creator: modelData.creator,
            version: modelData.versionName,
          },
          plan: {
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: planPrice,
            billingType: selectedPlan.billingType,
            rights,
            metadata: planMetadata,
          },
          totals: {
            subtotal: planPrice,
            fees: paymentData.fees,
            amount: totalAmount,
            currency: paymentData.currency,
          },
          timestamp: paymentData.timestamp,
        },
        paymentData,
        wallet: {
          provider: selectedWallet || 'phantom',
          network: 'solana',
        },
      };

      console.log('📤 Data to be sent to backend:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(backendPayload, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 백엔드 구현 전 - 임시로 성공 응답 시뮬레이션
      console.log('⏳ Simulating backend processing (2 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        accessPassId: 'pass_' + Math.random().toString(36).substr(2, 9),
        message: '결제가 성공적으로 처리되었습니다.'
      };

      console.log('✅ Backend response (simulated):', result);

      setTransactionResult(result);
      setPaymentSuccess(true);

      // 성공 후 결과 페이지로 이동 (3초 후)
      setTimeout(() => {
        window.location.href = `/purchase/${result.transactionHash}`;
      }, 3000);

    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentError(error.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const tokenLimitValue = coerceNumber(planMetadata?.monthlyTokenLimit);
  const generationLimitValue = coerceNumber(planMetadata?.monthlyGenerationLimit);
  const requestLimitValue = coerceNumber(planMetadata?.monthlyRequestLimit);

  const tokenLimitLabel = tokenLimitValue != null ? formatTokenLimit(tokenLimitValue) : null;
  const generationLimitLabel = generationLimitValue != null ? `${generationLimitValue.toLocaleString()} 회` : null;
  const requestLimitLabel = requestLimitValue != null ? `${requestLimitValue.toLocaleString()} 회` : null;

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
                  src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=100"
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
                    {planPrice === 0 ? '무료' : `${planPrice} SOL`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">플랫폼 수수료</span>
                  <span className="text-sm font-medium">{platformFee.toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">네트워크 수수료</span>
                  <span className="text-sm font-medium">~{networkFeeEstimate.toFixed(2)} SOL</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">총액</span>
                  <span className="font-bold text-xl text-gray-900">
                    {totalAmount.toFixed(2)} SOL
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
                      Phantom Wallet - {phantomWallet.getConnectionStatus().publicKey?.slice(0, 4)}...{phantomWallet.getConnectionStatus().publicKey?.slice(-4)} (Solana)
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
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">결제 완료!</h4>
                      <p className="text-gray-600 mb-6">트랜잭션이 성공적으로 처리되었습니다.</p>

                      {transactionResult && (
                        <div className="bg-green-50 rounded-lg p-4 mb-6">
                          <div className="text-sm text-green-800 space-y-1">
                            <div>트랜잭션 해시: <code className="font-mono">{transactionResult.transactionHash}</code></div>
                            <div>Access Pass ID: <code className="font-mono">{transactionResult.accessPassId}</code></div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-600">잠시 후 결과 페이지로 이동합니다...</p>
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
                            <span className="font-mono">0xModelHub...</span>
                          </div>
                          <div className="flex justify-between">
                            <span>금액:</span>
                            <span className="font-medium">{totalAmount.toFixed(2)} SOL</span>
                          </div>
                          <div className="flex justify-between">
                            <span>네트워크:</span>
                            <span>Solana</span>
                          </div>
                        </div>
                      </div>

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
