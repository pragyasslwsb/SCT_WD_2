// Get the page elements used by the stopwatch.
const timeDisplay = document.querySelector('#timeDisplay');
const startPauseButton = document.querySelector('#startPauseButton');
const startPauseIcon = document.querySelector('#startPauseIcon');
const startPauseText = document.querySelector('#startPauseText');
const lapButton = document.querySelector('#lapButton');
const resetButton = document.querySelector('#resetButton');
const statusText = document.querySelector('#statusText');
const statusPill = document.querySelector('#statusPill');
const hintText = document.querySelector('#hintText');
const lapSummary = document.querySelector('#lapSummary');
const lapCount = document.querySelector('#lapCount');
const lapsList = document.querySelector('#lapsList');
const emptyState = document.querySelector('#emptyState');

// Store the current timer state and recorded lap data.
let elapsedMilliseconds = 0;
let lastLapMilliseconds = 0;
let startedAt = 0;
let animationFrameId;
let isRunning = false;
let laps = [];

// Calculate elapsed time using the high-resolution browser timer.
function getElapsedMilliseconds() {
	if (!isRunning) return elapsedMilliseconds;
	return elapsedMilliseconds + performance.now() - startedAt;
}

// Convert milliseconds into the formats shown in the timer and lap table.
function formatTime(milliseconds) {
	const totalCentiseconds = Math.floor(milliseconds / 10);
	const centiseconds = totalCentiseconds % 100;
	const totalSeconds = Math.floor(totalCentiseconds / 100);
	const seconds = totalSeconds % 60;
	const minutes = Math.floor(totalSeconds / 60);
	const minutesText = String(minutes).padStart(2, '0');
	const secondsText = String(seconds).padStart(2, '0');
	const centisecondsText = String(centiseconds).padStart(2, '0');

	return {
		main: `${minutesText}:${secondsText}`,
		fraction: `.${centisecondsText}`,
		full: `${minutesText}:${secondsText}.${centisecondsText}`
	};
}

// Update the timer text and keep refreshing it while the stopwatch runs.
function renderTime() {
	const formattedTime = formatTime(getElapsedMilliseconds());
	timeDisplay.firstChild.textContent = formattedTime.main;
	timeDisplay.querySelector('.milliseconds').textContent = formattedTime.fraction;

	if (isRunning) {
		animationFrameId = requestAnimationFrame(renderTime);
	}
}

// Keep button labels, status text, and disabled states in sync with the timer.
function updateControls() {
	startPauseText.textContent = isRunning ? 'Pause' : 'Start';
	startPauseIcon.textContent = isRunning ? 'Ⅱ' : '▶';
	statusText.textContent = isRunning ? 'Running' : (elapsedMilliseconds ? 'Paused' : 'Ready');
	statusPill.classList.toggle('is-running', isRunning);
	hintText.textContent = isRunning
		? 'Keep going, your time is being tracked.'
		: (elapsedMilliseconds ? 'Paused. Resume whenever you are ready.' : 'Start the timer when you are ready.');
	lapButton.disabled = !isRunning;
	resetButton.disabled = !elapsedMilliseconds && laps.length === 0;
}

// Begin timing from the current performance timestamp.
function startTimer() {
	startedAt = performance.now();
	isRunning = true;
	updateControls();
	renderTime();
}

// Save the current elapsed time and stop the animation loop.
function pauseTimer() {
	elapsedMilliseconds = getElapsedMilliseconds();
	isRunning = false;
	cancelAnimationFrame(animationFrameId);
	updateControls();
	renderTime();
}

// Record the time since the previous lap and the total elapsed time.
function addLap() {
	const totalMilliseconds = getElapsedMilliseconds();
	const splitMilliseconds = totalMilliseconds - lastLapMilliseconds;

	laps.unshift({
		number: laps.length + 1,
		splitMilliseconds,
		totalMilliseconds
	});
	lastLapMilliseconds = totalMilliseconds;

	renderLaps();
	resetButton.disabled = false;
}

// Rebuild the lap table with the newest recorded lap at the top.
function renderLaps() {
	emptyState.hidden = laps.length > 0;
	lapsList.querySelectorAll('.lap-row').forEach((row) => row.remove());

	laps.forEach((lap, index) => {
		const row = document.createElement('tr');
		const latestLabel = index === 0 ? '<span class="latest-label">Latest</span>' : '';

		row.className = index === 0 ? 'lap-row latest-lap' : 'lap-row';
		row.innerHTML = `
			<th scope="row">
				<span class="lap-number">${String(lap.number).padStart(2, '0')}</span>
				${latestLabel}
			</th>
			<td>${formatTime(lap.splitMilliseconds).full}</td>
			<td>${formatTime(lap.totalMilliseconds).full}</td>
		`;
		lapsList.appendChild(row);
	});

	lapCount.textContent = `${laps.length} ${laps.length === 1 ? 'lap' : 'laps'}`;
	lapSummary.textContent = laps.length
		? `${laps.length} interval${laps.length === 1 ? '' : 's'} recorded`
		: 'Your recorded intervals will appear here.';
}

// Clear the timer and remove every recorded lap.
function resetTimer() {
	cancelAnimationFrame(animationFrameId);
	elapsedMilliseconds = 0;
	lastLapMilliseconds = 0;
	isRunning = false;
	laps = [];
	updateControls();
	renderTime();
	renderLaps();
}

// Connect the buttons to their stopwatch actions.
startPauseButton.addEventListener('click', () => {
	if (isRunning) {
		pauseTimer();
	} else {
		startTimer();
	}
});

lapButton.addEventListener('click', addLap);
resetButton.addEventListener('click', resetTimer);

// Provide keyboard shortcuts when the user is not typing in a form field.
document.addEventListener('keydown', (event) => {
	if (event.target.matches('input, textarea, select')) return;

	if (event.code === 'Space') {
		event.preventDefault();
		isRunning ? pauseTimer() : startTimer();
	} else if (event.key.toLowerCase() === 'l' && isRunning) {
		addLap();
	} else if (event.key.toLowerCase() === 'r') {
		resetTimer();
	}
});

// Set up the initial ready state when the page loads.
renderLaps();
updateControls();
renderTime();
