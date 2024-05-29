import { GET_FILES_URL, GET_FILE_CONTENT } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Cookies } from 'react-cookie';
import './Edit.css'
import axios from 'axios';
import EditComponent from '../components/EditComponent';
import ShareFileComponent from '../components/ShareFileComponent';
import { parseCredentialsJWT } from '../utils';

export default function Edit() {

    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [editorStringContent, setEditorStringContent] = useState(null);

    const authToken = new Cookies(document.cookie).get('authToken');
    if (!authToken) document.location.href = '/';
    const {pfpUrl, name} = parseCredentialsJWT(authToken);

    const selectRef = useRef(null);
    
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const authToken = new Cookies(document.cookie).get('authToken');
                const response = await axios.get(GET_FILES_URL, {withCredentials: true, headers: {"Authorization" : `${authToken}`}});
                if (response.status !== 200) {
                    throw new Error('Failed to fetch files');
                }
                const data = response.data;
                setFiles(data);
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        };
        
        fetchFiles();

    }, []);
    
    const handleEditDocument = () => {
        const fetchContent = async (filename) => {
            try {
                const authToken = new Cookies(document.cookie).get('authToken');
                const response = await axios.get(`${GET_FILE_CONTENT}/${filename}`, {withCredentials: true, headers: {"Authorization" : `${authToken}`}});
                return response;
            } catch (error) {
                console.error('Error:', error);
            }
        };

        const selectedFile = selectRef.current.value;

        if (selectedFile !== '') {
            fetchContent(selectedFile)
                .then(response => {
                    const stringContent = response.data;
                    setEditorStringContent(stringContent);
                    setSelectedFile(selectedFile);
                })
                .catch(error => {
                    console.error('Error fetching file content:', error);
                });
        }
    }

    return (
        <div align='center' className='selector'>
             <div className="taskbar" style={{justifyContent: 'space-between'}}>
                <a href='/home'><img src='/logo.png' style={{height: '100%'}} alt='Logo' /></a>
                <div style={{position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center'}}>
                    <img src={pfpUrl} style={{width: 40}} />
                    <p style={{padding: '0 5px'}}>|</p>
                    <div style={{textAlign: 'right' ,color: 'white'}}>{name}</div>
                </div>
            </div>
           
            <h1>Choose a file to Edit</h1>

            <select ref={selectRef} defaultValue={selectedFile}>
                <option value="">Select a file</option>
                {files.map(file => (
                    <option key={file} value={file}>
                        {file}
                    </option>
                ))}
            </select>

            {selectedFile && <ShareFileComponent file_name={selectedFile} />}

            <div>
                {selectedFile && (
                    <p>Selected File: {selectedFile}</p>
                )}
            </div>
            <div>
                <button onClick={handleEditDocument}>Edit Document</button>
            </div> 
            
            <EditComponent 
                editorStringContent={editorStringContent} 
                setEditorStringContent={setEditorStringContent}
                filename={selectedFile}
            />
        </div>
    );
};
