const PRODUCTION = document.location.href.endsWith('appspot.com/');

const BACKEND = PRODUCTION ? 'https://cloud-419006.lm.r.appspot.com' : 'http://localhost:8083';

// const GET_FILES_URL = BACKEND + '/files'
const GET_FILES_URL = BACKEND + '/api/blobs';
const TRANSLATE_URL = BACKEND + '/api/translate';
const GET_FILE_CONTENT = BACKEND + '/contents'
const UPDATE_FILE_CONTENT = BACKEND + '/save'
const LOGIN_URL = BACKEND + '/login'
const USERS_URL = BACKEND + '/users'
const SET_PERMISSION_URL = BACKEND + '/share'
export {
    PRODUCTION,
    GET_FILES_URL,
    GET_FILE_CONTENT,
    UPDATE_FILE_CONTENT,
    LOGIN_URL,
    USERS_URL,
    SET_PERMISSION_URL,
    TRANSLATE_URL
};
