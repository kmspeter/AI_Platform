// 팬텀 지갑 유틸리티
export class PhantomWalletService {
  constructor() {
    this.provider = null;
    this.publicKey = null;
    this.isConnected = false;
  }

  // 팬텀 지갑 설치 확인
  isPhantomInstalled() {
    return typeof window !== 'undefined' && 
           window.solana && 
           window.solana.isPhantom;
  }

  // 지갑 연결
  async connect() {
    if (!this.isPhantomInstalled()) {
      throw new Error('팬텀 지갑이 설치되지 않았습니다.');
    }

    try {
      const response = await window.solana.connect();
      this.provider = window.solana;
      this.publicKey = response.publicKey;
      this.isConnected = true;
      
      return {
        publicKey: response.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('Phantom connection error:', error);
      throw error;
    }
  }

  // 지갑 연결 해제
  async disconnect() {
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
      this.publicKey = null;
      this.isConnected = false;
    }
  }

  // 메시지 서명
  async signMessage(message) {
    if (!this.isConnected || !this.provider) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }

    try {
      // 메시지를 Uint8Array로 변환
      const encodedMessage = new TextEncoder().encode(message);
      
      // 서명 요청
      const signedMessage = await this.provider.signMessage(encodedMessage, 'utf8');
      
      return {
        signature: Array.from(signedMessage.signature),
        publicKey: this.publicKey.toString(),
        message: message
      };
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }

  // 트랜잭션 서명 (결제용)
  async signTransaction(transactionData) {
    if (!this.isConnected || !this.provider) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }

    try {
      // 실제 환경에서는 Solana Transaction 객체를 생성해야 함
      // 여기서는 데모용으로 메시지 서명을 사용
      const message = `결제 승인: ${JSON.stringify(transactionData)}`;
      const signature = await this.signMessage(message);
      
      return {
        ...signature,
        transactionData
      };
    } catch (error) {
      console.error('Transaction signing error:', error);
      throw error;
    }
  }

  // 현재 연결 상태 확인
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      publicKey: this.publicKey?.toString() || null,
      provider: this.provider ? 'Phantom' : null
    };
  }
}

// 싱글톤 인스턴스
export const phantomWallet = new PhantomWalletService();