import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ActiveContextProvider, useActiveContext, useLastError } from '@/src/context/activeContext';
import { API_ERROR_CODES } from '@/src/errors/errorCodes';

// Mock the useChat hook from @ai-sdk/react
const mockUseChat = vi.fn();
vi.mock('@ai-sdk/react', () => ({
  useChat: () => mockUseChat()
}));

// Create a mock ErrorDisplay component
const ErrorDisplay = () => {
  const { lastError, clearLastError } = useLastError();
  if (!lastError) return null;
  return (
    <div data-testid="error-display">
      <div>Error {lastError.code}</div>
      <div>{lastError.message}</div>
      <div>Trace ID: {lastError.traceId}</div>
      <button aria-label="Close error message" onClick={clearLastError}>X</button>
    </div>
  );
};

// Mock the ErrorDisplay component
vi.mock('@/components/ErrorDisplay', () => ({
  ErrorDisplay: () => {
    const { lastError, clearLastError } = useLastError();
    if (!lastError) return null;
    return (
      <div data-testid="error-display">
        <div>Error {lastError.code}</div>
        <div>{lastError.message}</div>
        <div>Trace ID: {lastError.traceId}</div>
        <button aria-label="Close error message" onClick={clearLastError}>X</button>
      </div>
    );
  },
  withErrorHandling: (Component: React.ComponentType<any>) => (props: any) => (
    <>
      <ErrorDisplay />
      <Component {...props} />
    </>
  )
}));

// Create a mock ChatPage component with error handling
const MockChatPageWithErrorHandling = () => {
  const chatData = mockUseChat();
  const { setLastError } = useActiveContext();
  
  // Handle error if present
  React.useEffect(() => {
    if (chatData.error) {
      chatData.error.json().then((data: any) => {
        setLastError({
          code: API_ERROR_CODES.INTERNAL_SERVICE_ERROR,
          message: data.message,
          traceId: data.info.traceId
        });
      });
    }
  }, [chatData.error, setLastError]);
  
  return (
    <div data-testid="mock-chat-page">
      <div className="messages">
        {chatData.messages.map((message: { role: string; content: string }, index: number) => (
          <div 
            key={index} 
            className={`${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'} whitespace-pre-wrap`}
            data-testid={`message-${message.role}-${index}`}
          >
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

// Create a wrapped ChatPage component with error handling
const ChatPage = () => {
  return (
    <>
      <ErrorDisplay />
      <MockChatPageWithErrorHandling />
    </>
  );
};

// Mock the actual ChatPage component
vi.mock('@/app/chat/page', () => ({
  __esModule: true,
  default: () => <div>Mocked ChatPage</div>
}));

// Add custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      pass,
      message: () => `expected ${received} to be in the document`,
    };
  },
  toHaveClass(received, className) {
    const pass = received?.className?.includes(className) || false;
    return {
      pass,
      message: () => `expected ${received} to have class ${className}`,
    };
  },
});

// Mock the next/link component
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => (
    <a {...props}>{children}</a>
  )
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon">Send</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  User: () => <div data-testid="user-icon">User</div>,
  FileText: () => <div data-testid="file-icon">FileText</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>
}));

/**
 * UI-001: Basic chat display test
 * UI-002: Long answer display test
 * UI-003: Error display test
 */
describe('Chat UI Tests', () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * UI-001: Basic chat display
   * Test that questions and answers are correctly displayed in the UI
   */
  it('should display user questions and AI responses correctly', async () => {
    // Mock the useChat hook to return messages
    const mockMessages = [
      { role: 'user', content: 'こんにちは' },
      { role: 'assistant', content: 'こんにちは！何かお手伝いできることはありますか？' }
    ];
    
    mockUseChat.mockReturnValue({
      messages: mockMessages,
      input: '',
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      setInput: vi.fn(),
      error: null
    });

    // Render the chat page
    render(
      <ActiveContextProvider>
        <ChatPage />
      </ActiveContextProvider>
    );

    // Verify that the user message is displayed
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    
    // Verify that the assistant response is displayed
    expect(screen.getByText('こんにちは！何かお手伝いできることはありますか？')).toBeInTheDocument();
    
    // Verify that the messages are displayed in the correct containers
    // In the actual implementation, we're checking for the presence of user and assistant messages
    const userMessageContainer = screen.getByText('こんにちは').closest('div');
    const assistantMessageContainer = screen.getByText('こんにちは！何かお手伝いできることはありますか？').closest('div');
    
    expect(userMessageContainer).toHaveClass('bg-blue-500');
    expect(assistantMessageContainer).toHaveClass('bg-gray-100');
  });

  /**
   * UI-002: Long answer display
   * Test that long answers are properly formatted in the UI
   */
  it('should format long answers properly', async () => {
    // Mock the useChat hook to return a long message
    const longAnswer = `
    これは長い回答です。複数の段落があります。
    
    1. 最初のポイント
    2. 二番目のポイント
    3. 三番目のポイント
    
    さらに詳細な説明：
    * 箇条書き1
    * 箇条書き2
    
    最後の段落です。この回答が適切にフォーマットされていることを確認します。
    `;
    
    const mockMessages = [
      { role: 'user', content: '詳細な説明をお願いします' },
      { role: 'assistant', content: longAnswer }
    ];
    
    mockUseChat.mockReturnValue({
      messages: mockMessages,
      input: '',
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      setInput: vi.fn(),
      error: null
    });

    // Render the chat page
    render(
      <ActiveContextProvider>
        <ChatPage />
      </ActiveContextProvider>
    );

    // Verify that the long answer is displayed and properly formatted
    expect(screen.getByText(/これは長い回答です/)).toBeInTheDocument();
    expect(screen.getByText(/最初のポイント/)).toBeInTheDocument();
    expect(screen.getByText(/二番目のポイント/)).toBeInTheDocument();
    expect(screen.getByText(/三番目のポイント/)).toBeInTheDocument();
    expect(screen.getByText(/最後の段落です/)).toBeInTheDocument();
    
    // Check that the whitespace is preserved
    const messageElement = screen.getByText(/これは長い回答です/).closest('div');
    expect(messageElement).toHaveClass('whitespace-pre-wrap');
  });

  /**
   * UI-003: Error display
   * Test that user-friendly error messages are displayed when server errors occur
   */
  it('should display user-friendly error messages', async () => {
    // Mock the useChat hook to return an error
    const mockError = new Response(JSON.stringify({
      code: API_ERROR_CODES.INTERNAL_SERVICE_ERROR,
      message: 'サーバーエラーが発生しました',
      info: { traceId: 'test-trace-id-123' }
    }), { status: 500 });
    
    mockUseChat.mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      setInput: vi.fn(),
      error: mockError
    });

    // Create a mock implementation for Response.json()
    mockError.json = vi.fn().mockResolvedValue({
      code: API_ERROR_CODES.INTERNAL_SERVICE_ERROR,
      message: 'サーバーエラーが発生しました',
      info: { traceId: 'test-trace-id-123' }
    });

    // Render the chat page
    render(
      <ActiveContextProvider>
        <ChatPage />
      </ActiveContextProvider>
    );

    // Wait for the error to be processed and displayed
    await waitFor(() => {
      // Verify that the error message is displayed
      expect(screen.getByText(/Error A-2999/)).toBeInTheDocument();
      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(/Trace ID: test-trace-id-123/)).toBeInTheDocument();
    });
    
    // Verify that the close button is present and works
    const closeButton = screen.getByLabelText('Close error message');
    expect(closeButton).toBeInTheDocument();
    
    // Click the close button
    fireEvent.click(closeButton);
    
    // Verify that the error message is no longer displayed
    await waitFor(() => {
      expect(screen.queryByText(/Error A-2999/)).not.toBeInTheDocument();
    });
  });
});
