import '../components/Taskbar.css';
import './Home.css';

export default function Home() {
    const handleCreate = () => {
        document.location.href = '/create';
    };

    const handleEdit = () => {
        document.location.href = '/edit';
    };

    const handleTranslate = () => {
        document.location.href = '/translate';
    };

    const handleTranscribe = () => {
        document.location.href = '/transcribe';
    };

    return (
        <div className="taskbar">
            <button className="main-option" onClick={handleCreate}>Create</button>
            <button className="main-option" onClick={handleEdit}>Edit</button>
            <button className="main-option" onClick={handleTranslate}>Doc-Translate</button>
            <button className="main-option" onClick={handleTranscribe}>Doc-Transcribe</button>
        </div>
    );
}
