"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, FileText, ArrowLeft, Database, Sparkles } from "lucide-react"
import Link from "next/link"
import { useChat } from "@ai-sdk/react"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Use setTimeout to ensure the input is set before submitting
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">AI サポートチャット</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 flex flex-col max-w-4xl">
        <Card className="flex-1 p-4 mb-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-16 w-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">AI サポートアシスタント</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                24時間対応のAIアシスタントです。製品やサービスに関するご質問にお答えします。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <SuggestedQuestion question="製品の使い方を教えてください" onSelect={handleSuggestedQuestion} />
                <SuggestedQuestion question="料金プランについて知りたいです" onSelect={handleSuggestedQuestion} />
                <SuggestedQuestion question="アカウント設定の変更方法は？" onSelect={handleSuggestedQuestion} />
                <SuggestedQuestion question="最新のアップデート情報を教えて" onSelect={handleSuggestedQuestion} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex max-w-[80%] ${
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-l-lg rounded-br-lg"
                        : "bg-gray-100 text-gray-800 rounded-r-lg rounded-bl-lg"
                    } p-3`}
                  >
                    <div className="mr-2 mt-1">
                      {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          {message.content.includes("FAQ回答") ? (
                            <>
                              <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                                <Database className="h-3 w-3" />
                                FAQ
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="質問を入力してください..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
    </div>
  )
}

interface SuggestedQuestionProps {
  question: string;
  onSelect: (question: string) => void;
}

function SuggestedQuestion({ question, onSelect }: SuggestedQuestionProps) {
  return (
    <Button 
      variant="outline" 
      className="justify-start h-auto py-2 px-3 text-left"
      onClick={() => onSelect(question)}
    >
      {question}
    </Button>
  );
}
