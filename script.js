// 音名とMIDIノート番号の対応
const noteToNumber = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
    'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 音程インターバル定義（半音単位）
const intervals = {
    'unison': 0,
    'minor2nd': 1,
    'major2nd': 2,
    'minor3rd': 3,
    'major3rd': 4,
    'perfect4th': 5,
    'tritone': 6,
    'perfect5th': 7,
    'minor6th': 8,
    'major6th': 9,
    'minor7th': 10,
    'major7th': 11,
    'octave': 12
};

// ピアノ伴奏用コードボイシング（ルート音省略、テンション追加）
const pianoVoicings = {
    '': { // ルート音のみ (Eb など) → M7として解釈
        intervals: [intervals.major3rd, intervals.perfect5th, intervals.major7th, intervals.major2nd + 12], // 3, 5, 7, 9
        description: 'Major 7th (interpreted from root only)'
    },
    'M': { // メジャートライアド (EbM など) → M7として解釈
        intervals: [intervals.major3rd, intervals.perfect5th, intervals.major7th, intervals.major2nd + 12], // 3, 5, 7, 9
        description: 'Major 7th (interpreted from major)'
    },
    'm': { // マイナートライアド (Ebm など)
        intervals: [intervals.minor3rd, intervals.perfect5th, intervals.minor7th, intervals.major2nd + 12], // b3, 5, b7, 9
        description: 'Minor 7th (interpreted from minor)'
    },
    'M7': {
        intervals: [intervals.major3rd, intervals.perfect5th, intervals.major7th, intervals.major2nd + 12], // 3, 5, 7, 9
        description: 'Root omitted, with 9th tension'
    },
    'm7': {
        intervals: [intervals.minor3rd, intervals.perfect5th, intervals.minor7th, intervals.major2nd + 12], // b3, 5, b7, 9
        description: 'Root omitted, with 9th tension'
    },
    '7': {
        intervals: [intervals.major3rd, intervals.tritone, intervals.minor7th, intervals.major2nd + 12], // 3, b7, 9 (altered voicing)
        description: 'Root omitted, altered voicing'
    },
    'm7b5': {
        intervals: [intervals.minor3rd, intervals.tritone, intervals.minor7th, intervals.major2nd + 12], // b3, b5, b7, 9
        description: 'Root omitted, with 9th tension'
    }
};

// ルート音から音名を取得
function parseRootNote(chord) {
    const match = chord.match(/^([A-G][#b]?)/);
    return match ? match[1] : null;
}

// コードタイプを取得
function parseChordType(chord) {
    const root = parseRootNote(chord);
    if (!root) return null;
    return chord.slice(root.length);
}

// ピアノ伴奏用ボイシングを生成（D2-D3範囲）
function generatePianoVoicing(rootNote, chordType) {
    const voicing = pianoVoicings[chordType];
    if (!voicing) return [];
    
    // カスタムボイシングが定義されている場合はそれを使用
    if (voicing.customVoicings && voicing.customVoicings[rootNote]) {
        return voicing.customVoicings[rootNote];
    }
    
    const rootNumber = noteToNumber[rootNote];
    if (rootNumber === undefined) return [];
    
    const notes = [];
    
    // D2から始まる適切なオクターブを決定
    const baseOctave = 2;
    
    voicing.intervals.forEach((interval, index) => {
        const noteNumber = (rootNumber + interval) % 12;
        let noteOctave = baseOctave + Math.floor((rootNumber + interval) / 12);
        
        // D2-D3範囲に収まるように調整
        const absoluteNote = noteOctave * 12 + noteNumber;
        const d2 = 2 * 12 + 2; // D2 = 26
        const d3 = 3 * 12 + 2; // D3 = 38
        
        // 範囲外の場合は適切なオクターブに調整
        if (absoluteNote < d2) {
            noteOctave += 1;
        } else if (absoluteNote > d3) {
            noteOctave -= 1;
        }
        
        notes.push(`${numberToNote[noteNumber]}${noteOctave}`);
    });
    
    return notes;
}

// ジャズピアノコードの動的生成
function generateJazzChords() {
    const chords = ['CM7', 'Dm7', 'Em7', 'FM7', 'G7', 'Am7', 'Bm7b5'];
    const result = {};
    
    chords.forEach(chord => {
        const root = parseRootNote(chord);
        const type = parseChordType(chord);
        
        if (root && type && pianoVoicings[type]) {
            const notes = generatePianoVoicing(root, type);
            result[chord] = {
                name: chord,
                notes: notes,
                description: notes.map(note => note.replace(/\d/, '')).join(' - ')
            };
        }
    });
    
    return result;
}

// ジャズピアノコードの定義（動的生成）
const jazzChords = generateJazzChords();

// DOM要素の取得
const chordInput = document.getElementById('chord-input');
const chordName = document.getElementById('chord-name');
const chordNotes = document.getElementById('chord-notes');
const pianoKeys = document.querySelectorAll('.key');


// 全ての鍵盤をリセット
function resetPiano() {
    pianoKeys.forEach(key => {
        key.classList.remove('active');
    });
}

// 複数コードの入力を処理（改行とカンマ区切り対応）
function processMultipleChords(input) {
    const chordContainer = document.getElementById('piano-container');
    chordContainer.innerHTML = ''; // 既存のピアノをクリア
    
    if (!input) {
        chordName.textContent = '';
        chordNotes.textContent = '';
        return;
    }
    
    // 改行ごとに分割し、各行をカンマ区切りで処理
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
        chordName.textContent = '';
        chordNotes.textContent = '';
        return;
    }
    
    const allValidChords = [];
    const allChordDescriptions = [];
    
    lines.forEach((line, lineIndex) => {
        // 各行をカンマ区切りで分割
        const chords = line.split(',').map(chord => chord.trim()).filter(chord => chord);
        
        const lineValidChords = [];
        
        chords.forEach(chordKey => {
            const chord = generateChordFromInput(chordKey);
            if (chord) {
                lineValidChords.push({ name: chordKey, chord: chord });
                allChordDescriptions.push(`${chordKey}: ${chord.description}`);
            }
        });
        
        if (lineValidChords.length > 0) {
            allValidChords.push({ line: lineIndex, chords: lineValidChords });
        }
    });
    
    if (allValidChords.length === 0) {
        chordName.textContent = 'エラー';
        chordNotes.textContent = '無効なコード名です';
        return;
    }
    
    // コード情報を表示
    const allChordNames = allValidChords.flatMap(line => line.chords.map(c => c.name));
    chordName.textContent = allChordNames.join(' - ');
    chordNotes.textContent = allChordDescriptions.join(' | ');
    
    // 各行に対してピアノ鍵盤を生成
    allValidChords.forEach((lineData, lineIndex) => {
        createPianoRowForChords(lineData.chords, lineIndex);
    });
}

// 単一コード用の関数（後方互換性）
function highlightChord(chordKey) {
    processMultipleChords(chordKey);
}

// 入力されたコード名から動的にコードを生成
function generateChordFromInput(chordName) {
    const root = parseRootNote(chordName);
    const type = parseChordType(chordName);
    
    if (!root || type === null || !pianoVoicings[type]) {
        return null;
    }
    
    const notes = generatePianoVoicing(root, type);
    return {
        name: chordName,
        notes: notes,
        description: notes.map(note => note.replace(/\d/, '')).join(' - ')
    };
}

// 各行のコードに対して横並びのピアノ鍵盤を生成
function createPianoRowForChords(chords, lineIndex) {
    const pianoContainer = document.getElementById('piano-container');
    
    // 行全体のラッパーを作成
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'piano-row';
    rowWrapper.innerHTML = `<div class="row-label">Line ${lineIndex + 1}</div>`;
    
    // 行内のピアノを横並びで配置するコンテナ
    const rowPianoContainer = document.createElement('div');
    rowPianoContainer.className = 'piano-row-container';
    
    chords.forEach((chordData, chordIndex) => {
        const uniqueId = `${lineIndex}-${chordIndex}`;
        
        // 個別のピアノラッパーを作成
        const pianoWrapper = document.createElement('div');
        pianoWrapper.className = 'piano-wrapper';
        pianoWrapper.innerHTML = `
            <div class="chord-label">
                <h3>${chordData.name}</h3>
                <p>${chordData.chord.description}</p>
            </div>
            <div class="piano" id="piano-${uniqueId}">
                <!-- C2-D3 range for proper piano layout -->
                <div class="key white" data-note="C2" data-piano="${uniqueId}">
                    <span class="note-label">C</span>
                </div>
                <div class="key black" data-note="C#2" data-piano="${uniqueId}">
                    <span class="note-label">C#</span>
                </div>
                <div class="key white" data-note="D2" data-piano="${uniqueId}">
                    <span class="note-label">D</span>
                </div>
                <div class="key black" data-note="D#2" data-piano="${uniqueId}">
                    <span class="note-label">D#</span>
                </div>
                <div class="key white" data-note="E2" data-piano="${uniqueId}">
                    <span class="note-label">E</span>
                </div>
                <div class="key white" data-note="F2" data-piano="${uniqueId}">
                    <span class="note-label">F</span>
                </div>
                <div class="key black" data-note="F#2" data-piano="${uniqueId}">
                    <span class="note-label">F#</span>
                </div>
                <div class="key white" data-note="G2" data-piano="${uniqueId}">
                    <span class="note-label">G</span>
                </div>
                <div class="key black" data-note="G#2" data-piano="${uniqueId}">
                    <span class="note-label">G#</span>
                </div>
                <div class="key white" data-note="A2" data-piano="${uniqueId}">
                    <span class="note-label">A</span>
                </div>
                <div class="key black" data-note="A#2" data-piano="${uniqueId}">
                    <span class="note-label">A#</span>
                </div>
                <div class="key white" data-note="B2" data-piano="${uniqueId}">
                    <span class="note-label">B</span>
                </div>
                <div class="key white" data-note="C3" data-piano="${uniqueId}">
                    <span class="note-label">C</span>
                </div>
                <div class="key black" data-note="C#3" data-piano="${uniqueId}">
                    <span class="note-label">C#</span>
                </div>
                <div class="key white" data-note="D3" data-piano="${uniqueId}">
                    <span class="note-label">D</span>
                </div>
            </div>
        `;
        
        rowPianoContainer.appendChild(pianoWrapper);
        
        // このピアノの鍵盤をハイライト
        chordData.chord.notes.forEach(note => {
            const key = pianoWrapper.querySelector(`[data-note="${note}"][data-piano="${uniqueId}"]`);
            if (key) {
                key.classList.add('active');
            }
        });
        
        // このピアノの鍵盤にクリックイベントを追加
        const keys = pianoWrapper.querySelectorAll('.key');
        keys.forEach(key => {
            key.addEventListener('click', handleKeyClick);
        });
    });
    
    rowWrapper.appendChild(rowPianoContainer);
    pianoContainer.appendChild(rowWrapper);
}

// 鍵盤クリック時の視覚効果
function handleKeyClick(event) {
    const note = event.currentTarget.dataset.note;
    console.log(`Clicked: ${note}`);
    
    // 一時的にクリック効果を表示
    event.currentTarget.style.transform = 'translateY(4px)';
    setTimeout(() => {
        if (!event.currentTarget.classList.contains('active')) {
            event.currentTarget.style.transform = '';
        }
    }, 150);
}

// イベントリスナーの設定
chordInput.addEventListener('input', (event) => {
    const inputValue = event.target.value.trim();
    highlightChord(inputValue);
});

chordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const inputValue = event.target.value.trim();
        highlightChord(inputValue);
    }
});

// 各鍵盤にクリックイベントを追加
pianoKeys.forEach(key => {
    key.addEventListener('click', handleKeyClick);
});

// 初期状態でコード選択をリセット
resetPiano();


// キーボードショートカット（オプション）
document.addEventListener('keydown', (event) => {
    // 入力フィールドにフォーカスがある場合はショートカットを無効化
    if (document.activeElement === chordInput) {
        return;
    }
    
    const keyMap = {
        '1': 'CM7',
        '2': 'Dm7',
        '3': 'Em7',
        '4': 'FM7',
        '5': 'G7',
        '6': 'Am7',
        '7': 'Bm7b5'
    };
    
    if (keyMap[event.key]) {
        chordInput.value = keyMap[event.key];
        highlightChord(keyMap[event.key]);
    }
});