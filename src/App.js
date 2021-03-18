import React, { useState, useEffect, useRef } from 'react';
//components
import Note from './components/Note';
import Notification from './components/Notification';
import LoginForm from './components/LoginForm';
import Togglable from './components/Togglable';
import NoteForm from './components/NoteForm';

//services
import noteService from './services/note';
import loginService from './services/login';

const App = () => {
	//states

	//
	const [notes, setNotes] = useState([]);
	const [showAll, setShowAll] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const [user, setUser] = useState(null);

	//refs
	const noteFormRef = useRef();

	//effect hooks
	useEffect(() => {
		noteService.getAll().then((initialNotes) => {
			setNotes(initialNotes);
		});
	}, []);

	useEffect(() => {
		const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser');
		if (loggedUserJSON) {
			const user = JSON.parse(loggedUserJSON);
			setUser(user);
			noteService.setToken(user.token);
		}
	}, []);

	//event handlers

	const handleLogin = async (userObject) => {
		//remove the username and pass and instead return them form the component.

		console.log('logging in with', userObject.username);
		try {
			const user = await loginService.login(userObject);

			window.localStorage.setItem('loggedNoteappUser', JSON.stringify(user));

			noteService.setToken(user.token);
			setUser(user);
		} catch (exception) {
			setErrorMessage('Wrong credentials');
			setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}
	};

	const handleLogout = () => {
		window.localStorage.removeItem('loggedNoteappUser');
		setUser(null);
	};

	const addNote = (noteObject) => {
		noteFormRef.current.toggleVisibility();
		noteService.create(noteObject).then((returnedNote) => {
			setNotes(notes.concat(returnedNote));
		});
	};

	const toggleImportanceOf = (id) => {
		const url = `http://localhost:3001/notes/${id}`;
		const note = notes.find((n) => n.id === id);
		const changedNote = { ...note, important: !note.important };

		noteService
			.update(id, changedNote)
			.then((returnedNote) => {
				setNotes(notes.map((note) => (note.id !== id ? note : returnedNote)));
			})
			.catch((error) => {
				setErrorMessage(`Note '${note.content}' was already removed from server`);
				setTimeout(() => {
					setErrorMessage(null);
				}, 5000);
			});
	};

	//components

	const noteForm = () => (
		<Togglable buttonLabel="new note" ref={noteFormRef}>
			<NoteForm createNote={addNote} />
		</Togglable>
	);

	const logOutButton = () => <button onClick={handleLogout}>logout</button>;

	const loginForm = () => (
		<Togglable buttonLabel="login">
			<LoginForm handleLogin={handleLogin} />
		</Togglable>
	);

	//helper functions
	const notesToShow = showAll ? notes : notes.filter((note) => note.important);

	return (
		<div>
			<h1>Notes</h1>
			<Notification message={errorMessage} />

			{user === null ? (
				loginForm()
			) : (
				<div>
					<p>{user.name} logged-in</p>
					{noteForm()}
					{logOutButton()}
					<div>
						<button onClick={() => setShowAll(!showAll)}>show {showAll ? 'important' : 'all'}</button>
					</div>
					<ul>
						{notesToShow.map((note, i) => (
							<Note key={i} note={note} toggleImportance={() => toggleImportanceOf(note.id)} />
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default App;
