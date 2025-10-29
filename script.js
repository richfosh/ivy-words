// --- GAME CONFIGURATION ---
const WORD_LIST = ["ant","apple","ball","banana","bed","bird","book","bus","cake","car","cat","cherry","chicken","chips","clock","cloud","cow","cup","daddy","dog","fish","flag","foot","fox","frog","georgia","grandad","grandma","grandpa","hand","hat","house","ivy","jimmy","key","leaf","moon","mummy","nanna","nose","pen","pig","rainbow","sheep","shoe","slide","snowman","star","sun","swing","zebra"];

const pictures = ['image/ant.png','image/apple.png','image/ball.png','image/banana.png','image/bed.png','image/bird.png','image/book.png','image/bus.png','image/cake.png','image/car.png','image/cat.png','image/cherry.png','image/chicken.png','image/chip.png','image/clock.png','image/cloud.png','image/cow.png','image/cup.png','image/daddy.png','image/dog.png','image/fish.png','image/flag.png','image/foot.png','image/fox.png','image/frog.png','image/georgia.png','image/grandad.png','image/grandma.png','image/grandpa.png','image/hand.png','image/hat.png','image/house.png','image/ivy.png','image/jimmy.png','image/key.png','image/leaf.png','image/moon.png','image/mummy.png','image/nanna.png','image/nose.png','image/pen.png','image/pig.png','image/rainbow.png','image/sheep.png','image/shoe.png','image/slide.png','image/snowman.png','image/star.png','image/sun.png','image/swing.png','image/zebra.png'];

let chosenWord = "";
let chosenPicture = "";

// --- GAME STATE FLAG (NEW) ---
let isGameActive = false;
  
// --- DRAG LOGIC VARIABLES ---
let draggedElement = null; 
let offsetX, offsetY;      
let currentDropZone = null; 
let sourceContainer = null; 

// Select static elements globally
const initialContainer = document.getElementById('initial-container');
const gridContainer = document.getElementById('drop-zone-grid');
const newGameBtn = document.getElementById('new-game-btn'); 

// These will be initialized in setupGame because they are dynamically created
let categoryDropZones = [];
let allDropTargets = [];

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// FIX: Added missing square brackets around the right-hand side of the destructuring assignment.
		[array[i], array[j]] = [array[j], array[i]]; 
	}
	return array;
}

// Helper function to get the current pointer position (supports mouse and touch)
function getPointerPosition(e) {
	const clientX = e.touches ? e.touches[0].clientX : e.clientX;
	const clientY = e.touches ? e.touches[0].clientY : e.clientY;
	return { clientX, clientY };
}

// Helper function for consistent color assignment
function getLetterColor(index) {
	// UPDATED: Using a palette of darker, high-contrast colors
	const colors = [
		'#fcd34d', // Amber 400
		'#34d399', // Emerald 400
		'#a78bfa', // Violet 400
		'#60a5fa', // Blue 400
		'#f472b6', // Pink 400
		'#fb7185', // Rose 400
		'#84cc16', // Lime 500
		'#fb923c', // Orange 400
		'#9ca3af', // Gray 400
	];
	// Cycle through colors
	return colors[index % colors.length];
}

// --- GAME LOGIC ---

function checkWord() {
	// Only check if the game is still active
	if (!isGameActive) return;

	const messageBox = document.getElementById('message-box');
	
	// Clear previous state and remove success animation
	messageBox.classList.remove('show', 'success', 'error');
	messageBox.classList.add('hidden');
	document.querySelectorAll('.drop-zone').forEach(zone => {
		zone.classList.remove('drop-zone-success');
	});


	// 1. Get the current tiles in the drop zones, returning null if the slot is empty.
	const letterArray = Array.from(categoryDropZones).map(zone => {
		const letterDiv = zone.children[0];
		// Return null if empty.
		return letterDiv ? letterDiv.textContent.toLowerCase() : null; 
	});

	// 2. Check if all slots are filled (i.e., the array contains no nulls)
	const isWordComplete = !letterArray.includes(null);

	if (!isWordComplete) {
		// Not all slots are filled, so we can't check for correctness yet.
		return; 
	}
	
	// --- ALL SLOTS ARE FILLED: Check and End Game/Provide Feedback ---

	// 3. Get the formed word now that we know it's complete
	const formedWord = letterArray.join('');

	// 4. Compare with the chosen word
	if (formedWord === chosenWord) {
		isGameActive = false; // Set game state to finished
		
		// Show success message
		messageBox.textContent = `😃 Well done! You found the word: ${chosenWord.toUpperCase()}!`;
		messageBox.classList.remove('hidden', 'error');
		messageBox.classList.add('show', 'success');
		
		// Visually highlight the drop zones with the success pulse
		document.querySelectorAll('.drop-zone').forEach(zone => {
			zone.classList.add('drop-zone-success');
		});
		
		// Show the "Start New Game" button
		newGameBtn.classList.remove('hidden');
		document.getElementById("initial-container").innerHTML = "";

		// Disable further dragging on win
		document.querySelectorAll('.draggable-letter').forEach(el => {
			el.removeEventListener('mousedown', handleDragStart);
			el.removeEventListener('touchstart', handleDragStart);
			el.classList.add('disabled-letter'); // Apply robust disabled style
		});

	} else {
		// Show error message
		messageBox.textContent = `😕 That's not quite right. Keep trying!`;
		messageBox.classList.remove('hidden', 'success');
		messageBox.classList.add('show', 'error');
	}
}


// --- GAME SETUP ---
function setupGame() {
	// Set game state to active
	isGameActive = true; 
	
	// Hide the "Start New Game" button immediately
	newGameBtn.classList.add('hidden'); 

	// 1. Choose a random word with picture
	const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
	chosenWord = WORD_LIST[randomIndex];
	chosenPicture = pictures[randomIndex];
	
	const originalLetters = chosenWord.split('');
	// Randomize the letter order for the initial container
	const shuffledLetters = shuffleArray([...originalLetters]); 

	// Clear and reset message box and drop zone success state
	const messageBox = document.getElementById('message-box');
	if (messageBox) { 
		messageBox.classList.remove('show', 'success', 'error');
		messageBox.classList.add('hidden');
		messageBox.textContent = '';
	}
	document.querySelectorAll('.drop-zone').forEach(zone => {
		zone.classList.remove('drop-zone-success');
	});


	// Clear existing tiles in initial container
	// The section title is the first child, so only remove children from index 1 onwards
	while (initialContainer.children.length > 1) {
		initialContainer.removeChild(initialContainer.lastChild);
	}
	
	// 2. Generate letter tiles dynamically using the SHUFFLED list
	shuffledLetters.forEach((letter, index) => {
		const letterDiv = document.createElement('div');
		// Use the letter content for the ID to help uniqueness if needed later
		letterDiv.id = `letter-${index}-${letter}`; 
		letterDiv.classList.add('draggable-letter'); 
		letterDiv.textContent = letter.toUpperCase();
		
		// Assign a color
		letterDiv.style.backgroundColor = getLetterColor(index);
		
		// IMPORTANT: Remove the disabled class on new game
		letterDiv.classList.remove('disabled-letter');

		// Attach drag listeners (re-attached on new game)
		letterDiv.addEventListener('mousedown', handleDragStart);
		letterDiv.addEventListener('touchstart', handleDragStart);
		
		initialContainer.appendChild(letterDiv);
	});

	/* 3. Update the main titles to reflect the game goal
	document.querySelector('h1').textContent = "Word Scramble Challenge";
	document.querySelector('.subtitle').textContent = 
		"Drag the letters to the slots below to form the target word. It has " + chosenWord.length + " letters.";*/
	
	// Insert picture
	document.getElementById("picture-zone").innerHTML = "";
	const imgContainer = document.getElementById('picture-zone');
	const img = document.createElement('img');
    //img.src = pictures[1];
	img.src = chosenPicture;
    imgContainer.appendChild(img);

	// 4. Clear existing target boxes and generate new ones (Dynamic Slot Creation)
	gridContainer.innerHTML = '';
	
	for (let i = 0; i < originalLetters.length; i++) {
		const dropZoneDiv = document.createElement('div');
		dropZoneDiv.id = `box-${i}`;
		dropZoneDiv.classList.add('drop-zone');
		
		const contentDiv = document.createElement('div');
		contentDiv.classList.add('drop-zone-content');
		contentDiv.dataset.name = `Slot ${i + 1}`; // Used for identification (internal)

		dropZoneDiv.appendChild(contentDiv);
		gridContainer.appendChild(dropZoneDiv);
	}

	// 5. Re-select drop zones for drag handlers (CRITICAL)
	categoryDropZones = document.querySelectorAll('.drop-zone-content');
	allDropTargets = Array.from(categoryDropZones).concat(initialContainer);
}


// --- DRAG HANDLERS ---
function handleDragStart(e) {
	// Check if the game is active. If not (meaning win condition met), prevent drag start.
	if (!isGameActive) return;
	// Also check if the letter itself is disabled (safety)
	if (e.currentTarget.classList.contains('disabled-letter')) return; 

	if (e.button !== 0 && !e.touches) return; 

	draggedElement = e.currentTarget;
	sourceContainer = draggedElement.parentElement;
	
	if (e.touches) {
		e.preventDefault();
	}
	
	const rect = draggedElement.getBoundingClientRect();
	const { clientX, clientY } = getPointerPosition(e);

	// Calculate the offset from the top-left of the tile to the pointer
	offsetX = clientX - rect.left;
	offsetY = clientY - rect.top;
	
	// Insert a placeholder if dragging from the initial container
	if (sourceContainer.id === 'initial-container') {
		const placeholder = document.createElement('div');
		placeholder.classList.add('draggable-letter', 'drag-placeholder');
		
		// Insert the placeholder exactly where the dragged element was
		sourceContainer.insertBefore(placeholder, draggedElement);
	}

	draggedElement.classList.add('is-dragging');
	
	// Setting position to fixed removes it from the flow
	draggedElement.style.position = 'fixed';
	draggedElement.style.width = rect.width + 'px';
	draggedElement.style.height = rect.height + 'px';
	draggedElement.style.zIndex = 1000;

	// FIX: Set the initial fixed position exactly to the current viewport position (rect.left/top).
	// This prevents the "jump" that occurred when relying on clientX/Y.
	draggedElement.style.left = rect.left + 'px'; 
	draggedElement.style.top = rect.top + 'px'; 

	document.addEventListener('mousemove', handleDragMove);
	document.addEventListener('mouseup', handleDragEnd);
	document.addEventListener('touchmove', handleDragMove);
	document.addEventListener('touchend', handleDragEnd);
}

function handleDragMove(e) {
	if (!draggedElement) return;

	const { clientX, clientY } = getPointerPosition(e);

	// Calculate the new fixed position based on the current pointer position minus the initial offset
	draggedElement.style.left = (clientX - offsetX) + 'px';
	draggedElement.style.top = (clientY - offsetY) + 'px';

	const dropPointX = clientX;
	const dropPointY = clientY;

	let foundDropZone = null;

	allDropTargets.forEach(target => {
		// Ensure we skip over the placeholder itself if it's the target
		if (target.classList && target.classList.contains('drag-placeholder')) return; 

		// If targeting the initial container, we need to check the entire zone
		const targetRect = target.getBoundingClientRect(); 
		
		// If targeting a category drop zone, check the content div only
		const rect = (target.classList.contains('drop-zone-content')) ? target.parentElement.getBoundingClientRect() : targetRect;
		
		const isOver = (
			dropPointX >= rect.left &&
			dropPointX <= rect.right &&
			dropPointY >= rect.top &&
			dropPointY <= rect.bottom
		);

		if (isOver) {
			// If over the outer drop-zone div, use its inner content div as the drop zone
			foundDropZone = (target.classList.contains('drop-zone-content')) ? target : foundDropZone;
			// If over the initial-container div, use the div itself
			foundDropZone = (target.id === 'initial-container') ? target : foundDropZone;
		}
		
		// Apply/Remove highlight class
		if (target === foundDropZone) {
			if (target.id === 'initial-container') {
				target.classList.add('initial-container-highlight');
			} else if (target.classList.contains('drop-zone-content')) {
				// Category box, highlight its outer parent
				target.parentElement.classList.add('drop-zone-highlight');
			}
		} else {
			if (target.id === 'initial-container') {
				target.classList.remove('initial-container-highlight');
			} else if (target.classList.contains('drop-zone-content')) {
				target.parentElement.classList.remove('drop-zone-highlight');
			}
		}
	});

	currentDropZone = foundDropZone;
}

function handleDragEnd() {
	if (!draggedElement) return;

	// 1. Check if the source was the initial container and find the placeholder
	const wasSourceInitialContainer = (sourceContainer && sourceContainer.id === 'initial-container');
	let placeholder = null;
	if (wasSourceInitialContainer) {
		placeholder = initialContainer.querySelector('.drag-placeholder');
	}
	
	// Check if the source was one of the category boxes
	const isSourceCategoryBox = Array.from(categoryDropZones).includes(sourceContainer);

	// --- Drop Logic ---
	if (currentDropZone) {
		if (currentDropZone.id === 'initial-container') {
			// Scenario: Drop on Initial Container (Insert into position)
			
			if (!placeholder) {
				// Case 1: Returning a tile from a category box (no placeholder exists).
				// Calculate insertion point based on coordinates.
				const dragRect = draggedElement.getBoundingClientRect();
				const dragCenterX = dragRect.left + dragRect.width / 2;
				
				// Find the existing letter tile we are hovering over (to insert before)
				// Filter out the section title to only consider draggable letters
				const children = Array.from(initialContainer.children).filter(
					child => child.classList.contains('draggable-letter') && !child.classList.contains('drag-placeholder')
				);
				
				let nextElement = null;
				for (const child of children) {
					const childRect = child.getBoundingClientRect();
					const childCenterX = childRect.left + childRect.width / 2;

					// If the dragged tile's center is to the left of the child's center, 
					// this child is the one we should insert before.
					if (dragCenterX < childCenterX) {
						nextElement = child;
						break;
					}
				}
				
				// Insert at the calculated position or append
				if (nextElement) {
					initialContainer.insertBefore(draggedElement, nextElement);
				} else {
					initialContainer.appendChild(draggedElement);
				}
			} else {
				// Case 2: Dragging a tile within the initial container. 
				// The placeholder holds the position. Insert the tile before the placeholder.
				initialContainer.insertBefore(draggedElement, placeholder);
			}


		} else {
			// Scenario: Drop on a Category Box
			const targetZoneHasContent = currentDropZone.children.length > 0;
			
			if (isSourceCategoryBox) {
				// Path 1: Source is a Category Box (Allows swap or move)
				if (targetZoneHasContent) {
					// Swap: Box -> Occupied Box
					const targetLetter = currentDropZone.children[0]; 
					sourceContainer.appendChild(targetLetter);
					currentDropZone.appendChild(draggedElement);
				} else {
					// Move: Box -> Empty Box
					currentDropZone.appendChild(draggedElement);
				}

			} else {
				// Path 2: Source is the Initial Container (Must obey the single-item constraint)
				if (targetZoneHasContent) {
					// Constraint: Initial -> Occupied Box -> RETURN to Initial Container
					if (placeholder) {
						// Explicitly return the tile to the placeholder's spot
						initialContainer.insertBefore(draggedElement, placeholder);
					} else {
						// Fallback/Safety
						sourceContainer.appendChild(draggedElement);
					}
				} else {
					// Move: Initial -> Empty Box
					currentDropZone.appendChild(draggedElement);
				}
			}
		}

	} else {
		// If dropped nowhere, return to the original source container.
		if (wasSourceInitialContainer && placeholder) {
			// Return to the placeholder's original spot
			initialContainer.insertBefore(draggedElement, placeholder);
		} else {
			// If source was a category box, just put it back in the box
			sourceContainer.appendChild(draggedElement);
		}
	}
	
	// 2. Final cleanup of placeholder if one was used
	if (placeholder) {
		placeholder.remove();
	}

	// 3. Cleanup and Reset styles (MUST happen after position is read and appendChild/insertBefore is done)
	document.removeEventListener('mousemove', handleDragMove);
	document.removeEventListener('mouseup', handleDragEnd);
	document.removeEventListener('touchmove', handleDragMove);
	document.removeEventListener('touchend', handleDragEnd);

	draggedElement.classList.remove('is-dragging');
	draggedElement.style.position = '';
	draggedElement.style.left = '';
	draggedElement.style.top = '';
	draggedElement.style.width = '';
	draggedElement.style.height = '';
	draggedElement.style.zIndex = '';

	// Remove all highlights
	document.querySelectorAll('.drop-zone').forEach(zone => {
		zone.classList.remove('drop-zone-highlight');
	});
	initialContainer.classList.remove('initial-container-highlight');

	// Reset state
	draggedElement = null;
	currentDropZone = null;
	sourceContainer = null;
	
	// 4. Check if the word is correct after the drag operation
	checkWord();
}

// --- Initialization ---
window.onload = setupGame;