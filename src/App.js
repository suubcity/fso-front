import React, { useState, useEffect } from 'react';
//components
import Note from './components/Note';
import Notification from './components/Notification';
import LoginForm from './components/LoginForm';

//services
import noteService from './services/notes';
import loginService from './services/login';

const App = () => {
	const [notes, setNotes] = useState([]);
	const [newNote, setNewNote] = useState('');
	const [showAll, setShowAll] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [user, setUser] = useState(null);

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

	const handleUsernameChange = (e) => {
		setUsername(e.target.value);
	};

	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
	};

	const handleLogin = async (event) => {
		event.preventDefault();
		console.log('logging in with', username, password);

		try {
			const user = await loginService.login({ username, password });

			window.localStorage.setItem('loggedNoteappUser', JSON.stringify(user));

			noteService.setToken(user.token);
			setUser(user);
			setUsername('');
			setPassword('');
		} catch (exception) {
			setErrorMessage('Wrong credentials');
			setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}
	};

	const addNote = (event) => {
		event.preventDefault();
		const noteObject = {
			content: newNote,
			date: new Date().toISOString(),
			important: Math.random() > 0.5,
			id: notes.length + 1,
		};

		noteService.create(noteObject).then((returnedNote) => {
			setNotes(notes.concat(returnedNote));
			setNewNote('');
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

	const handleNoteChange = (e) => {
		setNewNote(e.target.value);
	};

	const handleLogout = () => {
		window.localStorage.removeItem('loggedNoteappUser');
		setUser(null);
	};

	const notesToShow = showAll ? notes : notes.filter((note) => note.important);

	const noteForm = () => (
		<form onSubmit={addNote}>
			<input value={newNote} onChange={handleNoteChange} />
			<button type="submit">save</button>
		</form>
	);

	const logOutButton = () => <button onClick={handleLogout}>logout</button>;

	return (
		<div>
			<h1>Notes</h1>
			<Notification message={errorMessage} />

			{user === null ? (
				<LoginForm
					handleSubmit={handleLogin}
					handleUsernameChange={handleUsernameChange}
					handlePasswordChange={handlePasswordChange}
					username={username}
					password={password}
				/>
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
