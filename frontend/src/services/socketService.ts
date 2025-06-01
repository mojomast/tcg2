// Mock socket service for development
class MockSocketService {
  emit(event: string, data?: any) {
    console.log(`Mock Socket Emit: ${event}`, data);
    // In a real implementation, this would emit to a WebSocket
  }

  on(event: string, _callback: (data: any) => void) {
    console.log(`Mock Socket Listen: ${event}`);
    // In a real implementation, this would listen to WebSocket events
  }

  disconnect() {
    console.log('Mock Socket Disconnect');
  }
}

const socketService = new MockSocketService();
export default socketService;

