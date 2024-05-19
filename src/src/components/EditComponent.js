import { UPDATE_FILE_CONTENT } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Node, Transforms } from 'slate';
import axios from 'axios';
import { Cookies } from 'react-cookie';

import { SharedMap } from "fluid-framework";
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
    initialObjects: { documentMap: SharedMap }
};


let container;


async function handleFluidRelay(callback) {
    let id;
    if (window.location.hash) {
        id = window.location.hash.substring(1);
        container = (await client.getContainer(id, containerSchema)).container;
    } else {
        container = (await client.createContainer(containerSchema)).container;
        id = await container.attach();
        console.log(id);
        window.location.hash = id;
    }

    container.initialObjects.documentMap.on("valueChanged", callback);
}

export default function EditComponent({editorStringContent, filename, setShareable}) {
    const [editor, setEditor] = useState(() => withReact(createEditor()))
    const editorRef = useRef(null)
    const documentValueKey = filename;

    let editorValue = editorStringContent != null ? stringToEditorValue(editorStringContent) : [];


    if (documentValueKey) {
        handleFluidRelay(() => {
            const documentValue = container.initialObjects.documentMap.get(documentValueKey);
            // editorValue = documentValue;
    
            if (!editorRef.current) {
                return;
            }
    
            if (editorRef.current.value === documentValue) {
                return;
            }

            console.log('Set', documentValue);
            editorRef.current.value = documentValue;
        });
    }

    function stringToEditorValue(text) {
        const { insertText } = editor;
        const value = [{ type: 'paragraph', children: [{ text: '' }] }];
        Transforms.insertNodes(editor, value); // Insert initial paragraph
    
        const lines = text.split('\n');
    
        lines.forEach((line, index) => {
            if (index !== 0) {
                insertText('\n'); // Insert line break
            }
            insertText(line);
        });
    
        return editor.children;
    }

    const SlateWithRef = React.forwardRef(({ children, ...props }, ref) => (
        <Slate {...props}>
            <div ref={ref}>{children}</div>
        </Slate>
    ));

    const serializeToString = nodes => {
        return nodes.map(n => Node.string(n)).join('\n')
    }

    useEffect(() => {
        const handleSave = async (event) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault(); 

                if (setShareable) {
                    setShareable(true);
                }

                const text = serializeToString(editorValue);
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
    }, [editorValue, filename]);

    useEffect(() => {
        setEditor(() => withReact(createEditor()));
    }, [editorStringContent]);

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

    const handleChange = e => {
        if (!editorRef.current) {
            return;
        }

        if (!container) {
            return;
        }

        console.log('Send', e.target.value);
        container.initialObjects.documentMap.set(documentValueKey, e.target.value);
    }

    return (
        <div style={editorValue && editorValue.length > 0 ? editorStyles : {}}>
            {editorValue && editorValue.length > 0 && (
                <textarea value={editorStringContent} onChange={handleChange} ref={editorRef}>

                </textarea>
                // <SlateWithRef
                //     editor={editor}
                //     initialValue={editorValue}
                //     value={editorValue}
                //     onChange={handleChange}
                //     ref={editorRef}
                //     >
                //     <Editable autoFocus={false} />
                // </SlateWithRef>
            )}
            </div>
    );
}
