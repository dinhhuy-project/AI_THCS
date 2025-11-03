import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import './index.css';

const AIOnThi = () => {
    const [inputType, setInputType] = useState('text');
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error('Failed to read file as a data URL.'));
                }
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleGenerate = async () => {
        if ((inputType === 'text' && !textContent.trim()) || (inputType === 'pdf' && !file)) {
            setError('Vui lòng cung cấp nội dung để bắt đầu.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);
        setFlippedCards(new Set());
        setCurrentCardIndex(0);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const studySchema = {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.STRING,
                        description: "Một bản tóm tắt chi tiết của văn bản được cung cấp, nêu bật các ý chính và khái niệm quan trọng."
                    },
                    flashcards: {
                        type: Type.ARRAY,
                        description: "Một danh sách các cặp câu hỏi và câu trả lời để sử dụng làm thẻ ghi nhớ.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: {
                                    type: Type.STRING,
                                    description: "Câu hỏi cho mặt trước của thẻ ghi nhớ."
                                },
                                answer: {
                                    type: Type.STRING,
                                    description: "Câu trả lời cho mặt sau của thẻ ghi nhớ."
                                }
                            },
                            required: ["question", "answer"]
                        }
                    }
                },
                required: ["summary", "flashcards"]
            };

            const prompt = "Dựa trên tài liệu sau, vui lòng tạo một bản tóm tắt toàn diện và một bộ thẻ ghi nhớ (cặp câu hỏi/câu trả lời) để hỗ trợ việc học. Nội dung là:";

            let parts;

            if (inputType === 'pdf' && file) {
                const base64Data = await fileToBase64(file);
                parts = [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    }
                ];
            } else {
                 parts = [
                    { text: `${prompt}\n\n${textContent}` }
                ];
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: studySchema,
                }
            });

            const jsonResponse = JSON.parse(response.text);
            setResult(jsonResponse);

        } catch (e) {
            console.error(e);
            setError('Đã xảy ra lỗi khi tạo hướng dẫn học tập. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Vui lòng tải lên một tệp PDF hợp lệ.');
        }
    };
    
    const toggleFlipCard = (index) => {
        const newFlippedCards = new Set(flippedCards);
        if (newFlippedCards.has(index)) {
            newFlippedCards.delete(index);
        } else {
            newFlippedCards.add(index);
        }
        setFlippedCards(newFlippedCards);
    };

    const handlePrevCard = () => {
        setCurrentCardIndex(prev => Math.max(prev - 1, 0));
        setFlippedCards(new Set()); // Unflip card when navigating
    };

    const handleNextCard = () => {
        if (result && result.flashcards) {
            setCurrentCardIndex(prev => Math.min(prev + 1, result.flashcards.length - 1));
        }
        setFlippedCards(new Set()); // Unflip card when navigating
    };

    return (
        <div className="ai-on-thi-app container">
            <header>
                <h1>AI Trợ Lý Học Tập</h1>
                <p>Tạo tóm tắt và thẻ ghi nhớ từ tài liệu học tập của bạn ngay lập tức.</p>
            </header>

            <main>
                <div className="card">
                    <div className="tabs">
                        <button className={`tab ${inputType === 'text' ? 'active' : ''}`} onClick={() => setInputType('text')}>
                            Nhập văn bản
                        </button>
                        <button className={`tab ${inputType === 'pdf' ? 'active' : ''}`} onClick={() => setInputType('pdf')}>
                            Tải lên PDF
                        </button>
                    </div>

                    {inputType === 'text' ? (
                        <textarea
                            placeholder="Dán nội dung bài học của bạn vào đây..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                        />
                    ) : (
                        <label className="file-input-wrapper">
                            <input type="file" accept=".pdf" onChange={handleFileChange} />
                            {file ? (
                                <p className="file-name">Đã chọn: {file.name}</p>
                            ) : (
                                <p>Kéo và thả file PDF vào đây, hoặc <span>nhấn để chọn file</span></p>
                            )}
                        </label>
                    )}

                    <button
                        className="btn"
                        onClick={handleGenerate}
                        disabled={isLoading || (inputType === 'text' && !textContent.trim()) || (inputType === 'pdf' && !file)}
                        style={{ marginTop: '1.5rem' }}
                    >
                        {isLoading && <div className="loader"></div>}
                        {isLoading ? 'Đang tạo...' : 'Tạo Hướng Dẫn Học Tập'}
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {result && (
                    <div className="results-section">
                        <div className="card">
                            <h2>Tóm Tắt & Ý Chính</h2>
                            <p className="summary-content">{result.summary}</p>
                        </div>
                        {result.flashcards && result.flashcards.length > 0 && (
                            <div className="card flashcard-container-card">
                                <h2>Thẻ Ghi Nhớ</h2>
                                <div className="flashcard-viewer">
                                    <div 
                                        key={currentCardIndex} 
                                        className={`flashcard ${flippedCards.has(currentCardIndex) ? 'flipped' : ''}`} 
                                        onClick={() => toggleFlipCard(currentCardIndex)}
                                    >
                                        <div className="flashcard-inner">
                                            <div className="flashcard-front">
                                                <p>{result.flashcards[currentCardIndex].question}</p>
                                            </div>
                                            <div className="flashcard-back">
                                                <p>{result.flashcards[currentCardIndex].answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flashcard-nav">
                                    <button onClick={handlePrevCard} disabled={currentCardIndex === 0}>
                                        Trước
                                    </button>
                                    <span>
                                        {currentCardIndex + 1} / {result.flashcards.length}
                                    </span>
                                    <button onClick={handleNextCard} disabled={currentCardIndex === result.flashcards.length - 1}>
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
};


export default AIOnThi;