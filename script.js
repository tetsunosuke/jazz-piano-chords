// ジャズピアノコードの定義
const jazzChords = {
    'CM7': {
        name: 'C Major 7',
        notes: ['C4', 'E4', 'G4', 'B4'],
        description: 'C - E - G - B'
    },
    'Dm7': {
        name: 'D minor 7',
        notes: ['D4', 'F4', 'A4', 'C5'],
        description: 'D - F - A - C'
    },
    'Em7': {
        name: 'E minor 7',
        notes: ['E4', 'G4', 'B4', 'D5'],
        description: 'E - G - B - D'
    },
    'FM7': {
        name: 'F Major 7',
        notes: ['F4', 'A4', 'C5', 'E5'],
        description: 'F - A - C - E'
    },
    'G7': {
        name: 'G dominant 7',
        notes: ['G4', 'B4', 'D5', 'F4'],
        description: 'G - B - D - F'
    },
    'Am7': {
        name: 'A minor 7',
        notes: ['A4', 'C5', 'E5', 'G4'],
        description: 'A - C - E - G'
    },
    'Bm7b5': {
        name: 'B minor 7 flat 5',
        notes: ['B4', 'D5', 'F4', 'A4'],
        description: 'B - D - F - A'
    }
};

// DOM要素の取得
const chordSelect = document.getElementById('chord-select');
const chordName = document.getElementById('chord-name');
const chordNotes = document.getElementById('chord-notes');
const pianoKeys = document.querySelectorAll('.key');

// 全ての鍵盤をリセット
function resetPiano() {
    pianoKeys.forEach(key => {
        key.classList.remove('active');
    });
}

// 指定されたコードの鍵盤をハイライト
function highlightChord(chordKey) {
    resetPiano();
    
    if (!chordKey || !jazzChords[chordKey]) {
        chordName.textContent = '';
        chordNotes.textContent = '';
        return;
    }
    
    const chord = jazzChords[chordKey];
    
    // コード情報を表示
    chordName.textContent = chordKey;
    chordNotes.textContent = chord.description;
    
    // 対応する鍵盤をハイライト
    chord.notes.forEach(note => {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.add('active');
        }
    });
}

// 鍵盤クリック時の音符表示
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
chordSelect.addEventListener('change', (event) => {
    highlightChord(event.target.value);
});

// 各鍵盤にクリックイベントを追加
pianoKeys.forEach(key => {
    key.addEventListener('click', handleKeyClick);
});

// 初期状態でコード選択をリセット
resetPiano();

// キーボードショートカット（オプション）
document.addEventListener('keydown', (event) => {
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
        chordSelect.value = keyMap[event.key];
        highlightChord(keyMap[event.key]);
    }
});