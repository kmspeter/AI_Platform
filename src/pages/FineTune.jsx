import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FineTune = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState('upload');
  const [trainingConfig, setTrainingConfig] = useState({
    method: 'lora',
    preset: 'balanced',
    rank: 16,
    dropout: 0.1,
    batchSize: 4,
    steps: 1000
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStep, setTrainingStep] = useState(0);
  const [lossData, setLossData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const trainingIntervalRef = useRef(null);
  const logIntervalRef = useRef(null);
  const logsEndRef = useRef(null);

  const steps = [
    { number: 1, title: '데이터 선택', description: '훈련 데이터를 선택하거나 업로드하세요' },
    { number: 2, title: '기본 설정', description: '훈련 방법과 프리셋을 선택하세요' },
    { number: 3, title: '고급 설정', description: '세부 파라미터를 조정하세요' },
    { number: 4, title: '실행 & 모니터링', description: '훈련을 시작하고 진행상황을 확인하세요' },
    { number: 5, title: '결과 & 배포', description: '결과를 확인하고 새 버전을 등록하세요' }
  ];

  const presets = [
    { id: 'fast', name: '빠름', description: '빠른 훈련, 기본 품질', color: 'bg-green-100 text-green-800' },
    { id: 'balanced', name: '균형', description: '속도와 품질의 균형', color: 'bg-blue-100 text-blue-800' },
    { id: 'precise', name: '정밀', description: '최고 품질, 긴 훈련 시간', color: 'bg-purple-100 text-purple-800' }
  ];

  const estimatedCost = trainingConfig.steps * trainingConfig.batchSize * 0.001;
  const estimatedTime = Math.ceil(trainingConfig.steps / 100);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (isTraining && !isCompleted) {
      let currentStep = trainingStep;
      const totalSteps = trainingConfig.steps;
      const incrementPerSecond = Math.ceil(totalSteps / 10);

      logIntervalRef.current = setInterval(() => {
        const remainingSteps = totalSteps - currentStep;

        if (remainingSteps <= incrementPerSecond) {
          currentStep = totalSteps;
          setTrainingStep(currentStep);
          setTrainingProgress(100);
          clearInterval(logIntervalRef.current);
          setIsTraining(false);
          setIsCompleted(true);

          const baseLoss = 2.5;
          const decay = 0.998;
          const noise = (Math.random() - 0.5) * 0.05;
          const loss = (baseLoss * Math.pow(decay, currentStep / 10) + noise).toFixed(4);
          const lr = (0.0001 * Math.pow(0.95, currentStep / 100)).toExponential(2);
          addLog(`Step ${currentStep}/${totalSteps} - loss: ${loss}, lr: ${lr}`);

          setLossData(prevData => {
            const newData = [...prevData, { step: currentStep, loss: parseFloat(loss) }];
            return newData.slice(-50);
          });

          addLog('훈련 완료!');
          addLog('최종 손실: 0.234');
          addLog('모델 저장 중...');
          addLog('저장 완료!');
          return;
        }

        currentStep += incrementPerSecond;
        const progress = (currentStep / totalSteps) * 100;
        setTrainingStep(currentStep);
        setTrainingProgress(progress);

        const baseLoss = 2.5;
        const decay = 0.998;
        const noise = (Math.random() - 0.5) * 0.05;
        const loss = (baseLoss * Math.pow(decay, currentStep / 10) + noise).toFixed(4);
        const lr = (0.0001 * Math.pow(0.95, currentStep / 100)).toExponential(2);

        addLog(`Step ${currentStep}/${totalSteps} - loss: ${loss}, lr: ${lr}`);

        setLossData(prevData => {
          const newData = [...prevData, { step: currentStep, loss: parseFloat(loss) }];
          return newData.slice(-50);
        });
      }, 1000);
    }

    return () => {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    };
  }, [isTraining, isCompleted, trainingConfig.steps, trainingStep]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStep(0);
    setLossData([]);
    setLogs([]);
    setIsCompleted(false);
    addLog('훈련 준비 중...');
    setTimeout(() => addLog('데이터셋 로딩 완료'), 300);
    setTimeout(() => addLog('모델 초기화 완료'), 600);
    setTimeout(() => addLog('훈련 시작!'), 900);
  };

  const pauseTraining = () => {
    setIsTraining(false);
    addLog('훈련 일시정지됨');
  };

  const resumeTraining = () => {
    setIsTraining(true);
    addLog('훈련 재개됨');
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">파인튜닝 마법사</h1>
          <p className="text-gray-600 mt-2">모델을 커스터마이징하여 특정 작업에 최적화하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">진행 단계</h2>
              <div className="space-y-4">
                {steps.map(step => (
                  <div
                    key={step.number}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      step.number === currentStep
                        ? 'bg-blue-50 border border-blue-200'
                        : step.number < currentStep
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentStep(step.number)}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      step.number === currentStep
                        ? 'bg-blue-600 text-white'
                        : step.number < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.number < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{step.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">데이터 선택</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setSelectedDataset('upload')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedDataset === 'upload' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Upload className="h-6 w-6 text-blue-600 mb-2" />
                      <div className="font-medium text-gray-900">업로드</div>
                      <div className="text-sm text-gray-600">로컬 파일 업로드</div>
                    </button>
                    <button
                      onClick={() => setSelectedDataset('cleanroom')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedDataset === 'cleanroom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Database className="h-6 w-6 text-blue-600 mb-2" />
                      <div className="font-medium text-gray-900">클린룸</div>
                      <div className="text-sm text-gray-600">검증된 데이터셋</div>
                    </button>
                    <button
                      onClick={() => setSelectedDataset('market')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedDataset === 'market' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
                      <div className="font-medium text-gray-900">마켓</div>
                      <div className="text-sm text-gray-600">공개 데이터셋</div>
                    </button>
                  </div>

                  {selectedDataset === 'upload' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">JSON 또는 CSV 파일을 업로드하세요</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 설정</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">훈련 방법</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="method"
                            value="lora"
                            checked={trainingConfig.method === 'lora'}
                            onChange={(e) => setTrainingConfig({...trainingConfig, method: e.target.value})}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">LoRA</div>
                            <div className="text-sm text-gray-600">효율적인 파인튜닝</div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="method"
                            value="qlora"
                            checked={trainingConfig.method === 'qlora'}
                            onChange={(e) => setTrainingConfig({...trainingConfig, method: e.target.value})}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">QLoRA</div>
                            <div className="text-sm text-gray-600">메모리 효율적</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">안전 범위 프리셋</label>
                      <div className="grid grid-cols-3 gap-4">
                        {presets.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => setTrainingConfig({...trainingConfig, preset: preset.id})}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              trainingConfig.preset === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${preset.color}`}>
                              {preset.name}
                            </div>
                            <div className="text-sm text-gray-600">{preset.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">고급 설정</h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        랭크: {trainingConfig.rank}
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="64"
                        value={trainingConfig.rank}
                        onChange={(e) => setTrainingConfig({...trainingConfig, rank: Number(e.target.value)})}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>4 (빠름)</span>
                        <span>64 (정밀)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        드롭아웃: {trainingConfig.dropout}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.1"
                        value={trainingConfig.dropout}
                        onChange={(e) => setTrainingConfig({...trainingConfig, dropout: Number(e.target.value)})}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배치 크기: {trainingConfig.batchSize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="16"
                        value={trainingConfig.batchSize}
                        onChange={(e) => setTrainingConfig({...trainingConfig, batchSize: Number(e.target.value)})}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        훈련 스텝: {trainingConfig.steps}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="5000"
                        step="100"
                        value={trainingConfig.steps}
                        onChange={(e) => setTrainingConfig({...trainingConfig, steps: Number(e.target.value)})}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">비용/자원 추정</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">${estimatedCost.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">예상 비용</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{estimatedTime}시간</div>
                        <div className="text-sm text-gray-600">예상 시간</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">16GB</div>
                        <div className="text-sm text-gray-600">VRAM 필요</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      훈련 시작
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">실행 & 모니터링</h2>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">훈련 진행률</h3>
                        <div className="flex space-x-2">
                          {!isCompleted && (
                            <button
                              onClick={() => {
                                if (!isTraining && trainingProgress === 0) {
                                  startTraining();
                                } else if (isTraining) {
                                  pauseTraining();
                                } else {
                                  resumeTraining();
                                }
                              }}
                              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                isTraining ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isTraining ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              <span>{isTraining ? '일시정지' : trainingProgress > 0 ? '재개' : '시작'}</span>
                            </button>
                          )}
                          {isCompleted && (
                            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                              <CheckCircle className="h-4 w-4" />
                              <span>완료</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${trainingProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>스텝 {trainingStep} / {trainingConfig.steps}</span>
                        <span>{Math.floor(trainingProgress)}% 완료</span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Loss 그래프</h3>
                      {lossData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={lossData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="step"
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="loss"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">훈련을 시작하면 Loss 그래프가 표시됩니다</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">로그</h3>
                      <div
                        ref={logsEndRef}
                        className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto"
                      >
                        {logs.length > 0 ? (
                          logs.map((log, idx) => (
                            <div key={idx} className="mb-1">{log}</div>
                          ))
                        ) : (
                          <div className="text-gray-500">훈련을 시작하면 로그가 표시됩니다</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      disabled={!isCompleted}
                      className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                        isCompleted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      결과 보기
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">결과 & 배포</h2>

                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">평가 결과</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">92%</div>
                          <div className="text-sm text-gray-600">정확도</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">1.8s</div>
                          <div className="text-sm text-gray-600">평균 응답</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-700">A+</div>
                          <div className="text-sm text-gray-600">품질 등급</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">샘플 출력</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">입력:</div>
                          <div className="text-sm text-gray-900">"한국의 수도는 어디인가요?"</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-700 mb-1">출력:</div>
                          <div className="text-sm text-gray-900">"한국의 수도는 서울입니다. 서울은 한국의 정치, 경제, 문화의 중심지입니다."</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">새 버전 등록</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">버전 번호</label>
                          <input
                            type="text"
                            defaultValue="1.1.0"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">릴리스 노트</label>
                          <textarea
                            rows={3}
                            placeholder="이번 버전의 변경사항을 설명하세요"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                          새 버전 등록
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
