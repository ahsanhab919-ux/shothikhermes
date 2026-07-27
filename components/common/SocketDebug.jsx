import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { ENV } from '@/config/env';

const SocketDebug = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('socket'); // socket | backend | logic
    const [status, setStatus] = useState('Disconnected');
    const [socketId, setSocketId] = useState('');

    const [socketLogs, setSocketLogs] = useState([]);
    const [backendLogs, setBackendLogs] = useState([]);
    const [logicLogs, setLogicLogs] = useState([]);

    const { accessToken } = useSelector((state) => state.auth);
    const socketRef = useRef(null);

    const addLog = (type, msg) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${msg}`;

        if (type === 'socket') setSocketLogs(prev => [entry, ...prev].slice(0, 50));
        if (type === 'backend') setBackendLogs(prev => [entry, ...prev].slice(0, 50));
        if (type === 'logic') setLogicLogs(prev => [entry, ...prev].slice(0, 50));
    };

    useEffect(() => {
        // Connect to Paraphrase Socket
        const socketUrl = "http://localhost:5001";

        addLog('socket', `Initializing connection to ${socketUrl}...`);

        const socket = io(socketUrl, {
            path: "/paraphrase/socket.io",
            transports: ["polling", "websocket"],
            auth: { token: accessToken },
            reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus("Connected");
            setSocketId(socket.id);
            addLog('socket', `✅ Connected! ID: ${socket.id}`);
            addLog('logic', 'Frontend Logic: Socket connected successfully');
        });

        socket.on("connect_error", (err) => {
            setStatus("Error");
            addLog('socket', `❌ Connection Error: ${err.message}`);
        });

        socket.on("disconnect", (reason) => {
            setStatus("Disconnected");
            setSocketId("");
            addLog('socket', `⚠️ Disconnected: ${reason}`);
        });

        // Listen for ALL events for debugging
        socket.onAny((eventName, ...args) => {
            if (eventName === 'debug:log') {
                const [logData] = args;
                addLog('backend', `[SERVER] ${JSON.stringify(logData)}`);
            } else {
                addLog('socket', `📥 Received '${eventName}'`);
            }
        });

        // Hook into global fetch to capture API calls (basic logic tracing)
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            addLog('logic', `API Request: ${args[0]}`);
            try {
                const response = await originalFetch(...args);
                addLog('logic', `API Response [${response.status}]: ${args[0]}`);
                return response;
            } catch (error) {
                addLog('logic', `API Error: ${error.message}`);
                throw error;
            }
        };

        return () => {
            socket.disconnect();
            window.fetch = originalFetch;
        };
    }, [accessToken]);

    const copyToClipboard = () => {
        let text = "";
        if (activeTab === 'socket') text = socketLogs.join('\n');
        if (activeTab === 'backend') text = backendLogs.join('\n');
        if (activeTab === 'logic') text = logicLogs.join('\n');

        navigator.clipboard.writeText(text);
        alert(`${activeTab.toUpperCase()} logs copied!`);
    };

    const clearLogs = () => {
        if (activeTab === 'socket') setSocketLogs([]);
        if (activeTab === 'backend') setBackendLogs([]);
        if (activeTab === 'logic') setLogicLogs([]);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
                    background: '#222', color: '#0f0', border: '1px solid #0f0',
                    padding: '8px 12px', borderRadius: '5px', cursor: 'pointer',
                    fontWeight: 'bold', boxShadow: '0 0 10px rgba(0,255,0,0.2)'
                }}
            >
                🐞 Debug ({status})
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '400px',
            height: '300px',
            background: 'rgba(10, 10, 10, 0.95)',
            color: '#e0e0e0',
            border: '1px solid #0f0',
            borderRadius: '8px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '12px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}>
            {/* Header */}
            <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>🛠️ Debugger</span>
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: status === 'Connected' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                        color: status === 'Connected' ? '#0f0' : '#f00',
                        border: `1px solid ${status === 'Connected' ? '#0f0' : '#f00'}`
                    }}>
                        {status}
                    </span>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333', background: '#1a1a1a' }}>
                {['socket', 'backend', 'logic'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            background: activeTab === tab ? '#222' : 'transparent',
                            color: activeTab === tab ? '#0f0' : '#888',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #0f0' : 'none',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '10px', background: '#000' }}>
                {activeTab === 'socket' && socketLogs.length === 0 && <div style={{ color: '#444' }}>No socket logs yet...</div>}
                {activeTab === 'socket' && socketLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap', color: log.includes('Error') ? '#f55' : '#cfc' }}>{log}</div>
                ))}

                {activeTab === 'backend' && backendLogs.length === 0 && <div style={{ color: '#444' }}>Waiting for server debug events...</div>}
                {activeTab === 'backend' && backendLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap', color: '#aaf' }}>{log}</div>
                ))}

                {activeTab === 'logic' && logicLogs.length === 0 && <div style={{ color: '#444' }}>No logic traces...</div>}
                {activeTab === 'logic' && logicLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap', color: '#fea' }}>{log}</div>
                ))}
            </div>

            {/* Footer / Actions */}
            <div style={{ padding: '8px', borderTop: '1px solid #333', background: '#111', display: 'flex', gap: '10px' }}>
                <button onClick={copyToClipboard} style={{ flex: 1, padding: '5px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
                    📋 Copy Logs
                </button>
                <button onClick={clearLogs} style={{ flex: 1, padding: '5px', background: '#300', color: '#f88', border: '1px solid #500', borderRadius: '4px', cursor: 'pointer' }}>
                    🗑️ Clear
                </button>
            </div>
        </div>
    );
};

export default SocketDebug;
