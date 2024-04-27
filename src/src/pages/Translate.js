import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor } from 'slate';
import EditComponent from '../components/EditComponent';
import { GET_FILES_URL, TRANSLATE_URL } from '../config';


export default function Translate() {

    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState('')
    const [targetLanguage, setTargetLanguage] = useState('')

    const [toTranslate, setToTranslate] = useState('');
    const [translatedText, setTranslatedText] = useState('');

    const selectRef = useRef(null);



    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await axios.get(GET_FILES_URL, {withCredentials: true});
                if (response.status !== 200) {
                    throw new Error('Failed to fetch files');
                }
                const data = response.data;
                setFiles(data);
                console.log(data.blobs)
                console.log(typeof(data))
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        };
        
        fetchFiles();

    }, []);

    const handleTranslation = async () => {
        console.log(selectedFile)
        console.log(sourceLanguage)
        console.log(targetLanguage)
        const blobName = selectedFile

        try {
            const response = await axios.post(TRANSLATE_URL, null, {
                withCredentials: true,
                params: {blobName, sourceLanguage, targetLanguage}
            });
            console.log("debug:")
            setToTranslate(response.data.textToTranslate);
            setTranslatedText(response.data.translatedText);
        } catch (error) {
            console.error('Error translating file:', error);
        }
    }
    useEffect(() => {
        setToTranslate('')
        setTranslatedText('')
        
    }, [selectedFile, sourceLanguage, targetLanguage]);

    return (
        <div align='center' className='selector'>
            <div style={{position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center'}}>
                <img style={{width: 40}} />
                <p style={{padding: '0 5px'}}>|</p>
            </div>
            <h1>Choose a file to Translate</h1>

            <select ref={selectRef} 
            value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)
            }>
                <option value="">Select a file</option>
                {files.map(file => (
                    <option key={file} value={file}>
                        {file}
                    </option>
                ))}
            </select>

            <div>
                <label htmlFor="fromSelect">Translate from:   </label>
                <select id="fromSelect" value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}>
                    <option value="">Select language</option>
                    <option value="de">German</option>
                    <option value="en">English</option>
                    <option value="ro">Romanian</option>
                    <option value="fr">French</option>
                    <option value="it">Italian</option>
                    <option value="ru">Russian</option>
                </select>

                <label htmlFor="toSelect">  to:  </label>
                <select id="toSelect" value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
                    <option value="">Select language</option>
                    <option value="de">German</option>
                    <option value="en">English</option>
                    <option value="ro">Romanian</option>
                    <option value="fr">French</option>
                    <option value="it">Italian</option>
                    <option value="ru">Russian</option>
                </select>
            </div>

            <div>
                <button onClick={handleTranslation}>Translate!</button>
            </div> 

            {toTranslate.trim() !== '' && translatedText.trim() !== '' && (
            <div>
                <EditComponent 
                    editorStringContent={toTranslate} 
                    with_save={false}
                />
                <EditComponent 
                    editorStringContent={translatedText} 
                    with_save={false}
                />
            </div>
            )}



        </div>
    );
}