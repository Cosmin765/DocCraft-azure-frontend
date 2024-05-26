import { UPDATE_FILE_CONTENT } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Node, Transforms } from 'slate';
import axios from 'axios';
import { Cookies } from 'react-cookie';

import { SharedMap, SharedString } from "fluid-framework";
import { AzureClient } from "@fluidframework/azure-client";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";

import { v4 as uuidv4 } from 'uuid';


const user = uuidv4();

const serviceConfig = {
    connection: {
        type: 'remote',
        tenantId: process.env.REACT_APP_TENANT_ID,
        tokenProvider: new InsecureTokenProvider(process.env.REACT_APP_PRIMARY_KEY, user),
        endpoint: process.env.REACT_APP_ENDPOINT
    }
};

const client = new AzureClient(serviceConfig);
const containerSchema = {
    initialObjects: { documentString: SharedString  }
};


let container = null;
let lastFilename = null;
let containerId = null;


async function handleFluidRelay(callback) {
    if (window.location.hash) {
        containerId = window.location.hash.substring(1);
        container = (await client.getContainer(containerId, containerSchema)).container;
    } else {
        container = (await client.createContainer(containerSchema)).container;
        containerId = await container.attach();
        window.location.hash = containerId;
    }

    container.initialObjects.documentString.on("sequenceDelta", callback);
}

window.addEventListener('hashchange', e => {
    const oldURL = e.oldURL;
    const newURL = e.newURL;

    const oldHash = oldURL.search('#') !== -1 ? oldURL.substring(oldURL.search('#') + 1) : '';
    const newHash = newURL.search('#') !== -1 ? newURL.substring(newURL.search('#') + 1) : '';

    if (!oldHash || !newHash || newHash === containerId) {
        return;
    }

    window.location.reload();
})

export default function EditComponent({editorStringContent, setEditorStringContent, filename, setShareable}) {

    const editorRef = useRef(null)

    setTimeout(() => {
        if (filename !== lastFilename && container !== null) {
            container.disconnect();
            container = null;
            window.location.hash = '';
        }

        if (filename && filename !== lastFilename && container === null) {
            handleFluidRelay(({deltaOperation, isLocal}) => {
                const receivedChange = container.initialObjects.documentString.getText();
    
                if (deltaOperation !== 1) {
                    return;
                }
    
                if (!editorRef.current) {
                    return;
                }
    
                if (isLocal) {
                    return;
                }
        
                if (editorRef.current.value === receivedChange) {
                    return;
                }
               
                setEditorStringContent(receivedChange);
            });
        }

        if (filename !== lastFilename) {
            lastFilename = filename;
        }
    }, 200);

    

    useEffect(() => {
        const handleSave = async (event) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault(); 

                if (setShareable) {
                    setShareable(true);
                }

                const text = editorStringContent;
                try {
                    const authToken = new Cookies(document.cookie).get('authToken');
                    await axios.post(`${UPDATE_FILE_CONTENT}/${filename}`, {
                        content: text,
                    }, {withCredentials: true, headers: {"Authorization" : `${authToken}`}});
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            }
        };
        
        document.addEventListener('keydown', handleSave);

        return () => document.removeEventListener('keydown', handleSave);
    }, [editorStringContent, filename]);

    const handleChange = e => {
        if (!editorRef.current) {
            return;
        }

        if (!container) {
            console.error('Container not initialized');
            return;
        }

        container.initialObjects.documentString.replaceText(0, container.initialObjects.documentString.getText().length, e.target.value);

        setEditorStringContent(e.target.value);
    }

    return (
        <div style={editorStringContent !== null ? editorStyles : {}}>
            {editorStringContent !== null && (
                <textarea style={textAreaStyles} rows="20" cols="33" value={editorStringContent} onChange={handleChange} ref={editorRef}></textarea>
            )}
            </div>
    );
}


const editorStyles = {
    width: '60%',
    marginTop: '10px',
    minHeight: '300px', 
    backgroundColor: '#f4f4f4', 
    color: '#000000',
    padding: '10px',
    borderRadius: '5px', 
    overflowY: 'auto',
    textAlign: 'left'
};

const textAreaStyles = {
    width: '100%',
    height: '100%'
}
