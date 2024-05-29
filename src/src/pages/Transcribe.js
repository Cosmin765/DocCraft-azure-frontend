import React, { useState } from 'react';
import EditComponent from '../components/EditComponent';
import { Cookies } from 'react-cookie';
import { parseCredentialsJWT } from '../utils';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


export default function Transcribe() {
    const ffmpeg = new FFmpeg();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [response, setResponse] = useState('');
    let recognizer;
    let recognizedText = "";

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const loadFFmpeg = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    const convertToWav = async (file) => {
        await loadFFmpeg();
        await ffmpeg.writeFile('input', await fetchFile(file));
        await ffmpeg.exec(['-i', 'input', '-ar', '16000', '-ac', '1', '-f', 'wav', 'output.wav']);
        const data = await ffmpeg.readFile('output.wav');
        return data;
    };

    const stopContinuousRecognition = (recognizer) => {
        if (recognizer) {
            recognizer.stopContinuousRecognitionAsync(() => {
                setStatus('Recognition stopped.');
            }, (err) => {
                setStatus(`Error stopping recognition: ${err.message}`);
            });
        }
    };

    const handleFileUpload = async () => {
        if (!file) {
            setStatus('Please select a file first.');
            return;
        }

        setStatus('Converting file to required format...');
        const wavFile = await convertToWav(file);
        const audioConfig = sdk.AudioConfig.fromWavFileInput(wavFile);
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.REACT_APP_SPEECH_KEY, process.env.REACT_APP_SPEECH_REGION);
        const autoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "fr-FR", "ro-RO", "ru-RU"]);
        recognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, autoDetectSourceLanguageConfig, audioConfig);

        setStatus('Recognizing 5 minutes of speech...');
        recognizer.startContinuousRecognitionAsync();

        recognizer.recognized = (s, e) => {
            if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                if (recognizedText) {
                    recognizedText += " ";
                }
                recognizedText += e.result.text;
                setResponse(recognizedText);
            }
        };

        recognizer.canceled = (s, e) => {
            if (e.reason === sdk.CancellationReason.Error) {
                setStatus(`Recognition was canceled, error ${e.errorCode}, ${e.errorDetails}`);
            }
            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.sessionStopped = (s, e) => {
            setStatus("Recognition session was stopped.");
            recognizer.stopContinuousRecognitionAsync();
        };

        setTimeout(stopContinuousRecognition, 300000, recognizer);
    };

    const authToken = new Cookies(document.cookie).get('authToken');
    if (!authToken) document.location.href = '/';
    const { pfpUrl, name } = parseCredentialsJWT(authToken);

    return (
        <div align='center' className='selector'>
            <div className="taskbar" style={{ justifyContent: 'space-between' }}>
                <a href='/home'><img src='/logo.png' style={{ height: '100%' }} alt='Logo' /></a>
                <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center' }}>
                    <img src={pfpUrl} style={{ width: 40 }} />
                    <p style={{ padding: '0 5px' }}>|</p>
                    <div style={{ textAlign: 'right', color: 'white' }}>{name}</div>
                </div>
            </div>
            <h1>Choose an audio file to Transcribe</h1>

            <div>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
                <button onClick={handleFileUpload}>Upload</button>
            </div>

            <div>Status: {status}</div>

            {response.trim() !== '' && (
                <div>
                    <EditComponent
                        editorStringContent={response}
                        with_save={false}
                    />
                </div>
            )}
        </div>
    );
}