// 音名とMIDIノート番号の対応
const noteToNumber = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
    'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// シャープ記号をフラット記号に変換
function sharpToFlat(note) {
    const sharpToFlatMap = {
        'C#': 'Db',
        'D#': 'Eb', 
        'F#': 'Gb',
        'G#': 'Ab',
        'A#': 'Bb'
    };
    
    return note.replace(/([CDFGA]#)/g, (match) => sharpToFlatMap[match] || match);
}

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
        intervals: [intervals.major3rd, intervals.perfect5th, intervals.minor7th, intervals.major2nd + 12], // 3, 5, b7, 9
        description: 'Root omitted, with 9th tension'
    },
    'm7b5': {
        intervals: [intervals.minor3rd, intervals.tritone, intervals.minor7th, intervals.major2nd + 12], // b3, b5, b7, 9
        description: 'Root omitted, with 9th tension'
    },
    'dim7': {
        intervals: [intervals.minor3rd, intervals.tritone, intervals.major6th, intervals.major2nd + 12], // b3, b5, bb7(6th), 9
        description: 'Diminished 7th, root omitted'
    },
    'alt': {
        intervals: [intervals.major3rd, intervals.minor7th, intervals.minor2nd + 12, intervals.tritone + 12], // 3, b7, b9, #11
        description: 'Altered dominant, root omitted'
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

// 音名を絶対音高（MIDI番号）に変換
function noteToMidiNumber(note) {
    const match = note.match(/([A-G][#b]?)(\d+)/);
    if (!match) return null;
    
    const [, noteName, octave] = match;
    const noteNumber = noteToNumber[noteName];
    if (noteNumber === undefined) return null;
    
    return parseInt(octave) * 12 + noteNumber;
}

// MIDI番号を音名に変換
function midiNumberToNote(midiNumber) {
    const octave = Math.floor(midiNumber / 12);
    const noteNumber = midiNumber % 12;
    return `${numberToNote[noteNumber]}${octave}`;
}

// コードの全ての転回形を生成（C#2-D#3範囲制限）
function generateAllInversions(rootNote, chordType) {
    const voicing = pianoVoicings[chordType];
    if (!voicing) return [];
    
    const rootNumber = noteToNumber[rootNote];
    if (rootNumber === undefined) return [];
    
    const baseNotes = [];
    const baseOctave = 2;
    
    // 基本ボイシングを生成
    voicing.intervals.forEach(interval => {
        const noteNumber = (rootNumber + interval) % 12;
        const noteOctave = baseOctave + Math.floor((rootNumber + interval) / 12);
        baseNotes.push(noteOctave * 12 + noteNumber);
    });
    
    const inversions = [];
    const cs2 = 2 * 12 + 1; // C#2 = 25
    const ds3 = 3 * 12 + 3; // D#3 = 39
    
    // 基本形と転回形を生成
    for (let inv = 0; inv < baseNotes.length; inv++) {
        const inversionNotes = [...baseNotes];
        
        // 下の音を1オクターブ上に移動（転回）
        for (let i = 0; i < inv; i++) {
            inversionNotes[i] += 12;
        }
        
        // 範囲内に収まるように全体を調整
        let minNote = Math.min(...inversionNotes);
        let maxNote = Math.max(...inversionNotes);
        
        // 範囲内に収まるまでオクターブ調整
        while (minNote < cs2) {
            inversionNotes.forEach((note, i) => inversionNotes[i] = note + 12);
            minNote += 12;
            maxNote += 12;
        }
        while (maxNote > ds3) {
            inversionNotes.forEach((note, i) => inversionNotes[i] = note - 12);
            minNote -= 12;
            maxNote -= 12;
        }
        
        // 範囲内に収まる場合のみ追加
        if (minNote >= cs2 && maxNote <= ds3) {
            const noteNames = inversionNotes
                .sort((a, b) => a - b)
                .map(midiNumber => midiNumberToNote(midiNumber));
            inversions.push(noteNames);
        }
    }
    
    return inversions.length > 0 ? inversions : [generateBasicVoicing(rootNote, chordType)];
}

// 基本ボイシング生成（フォールバック用）
function generateBasicVoicing(rootNote, chordType) {
    const voicing = pianoVoicings[chordType];
    if (!voicing) return [];
    
    const rootNumber = noteToNumber[rootNote];
    if (rootNumber === undefined) return [];
    
    const notes = [];
    const baseOctave = 2;
    
    voicing.intervals.forEach((interval, index) => {
        const noteNumber = (rootNumber + interval) % 12;
        let noteOctave = baseOctave + Math.floor((rootNumber + interval) / 12);
        
        const absoluteNote = noteOctave * 12 + noteNumber;
        const cs2 = 2 * 12 + 1; // C#2 = 25  
        const ds3 = 3 * 12 + 3; // D#3 = 39
        
        if (absoluteNote < cs2) {
            noteOctave += 1;
        } else if (absoluteNote > ds3) {
            noteOctave -= 1;
        }
        
        notes.push(`${numberToNote[noteNumber]}${noteOctave}`);
    });
    
    return notes;
}

// コードの音域（最高音 - 最低音）を計算
function calculateSpan(chord) {
    if (!chord || chord.length === 0) return 0;
    
    const midiNumbers = chord.map(noteToMidiNumber).filter(n => n !== null);
    if (midiNumbers.length === 0) return 0;
    
    return Math.max(...midiNumbers) - Math.min(...midiNumbers);
}

// 2つのコード間の指位置の一致度を計算（同じ音が同じ指位置にあるかを重視）
function calculateFingerPositionScore(chord1, chord2) {
    if (!chord1 || !chord2) return 0;
    
    // 各コードをMIDI番号でソートして指の位置を決める
    const sorted1 = chord1.map(noteToMidiNumber).filter(n => n !== null).sort((a, b) => a - b);
    const sorted2 = chord2.map(noteToMidiNumber).filter(n => n !== null).sort((a, b) => a - b);
    
    let score = 0;
    const minLength = Math.min(sorted1.length, sorted2.length);
    
    // 同じ指位置（左からの順番）で同じ音があるかチェック
    for (let i = 0; i < minLength; i++) {
        if (sorted1[i] === sorted2[i]) {
            score += 3; // 同じ指位置で同じ音：最高スコア
        }
    }
    
    // 異なる指位置でも同じ音があるかチェック（低いスコア）
    for (let i = 0; i < sorted1.length; i++) {
        for (let j = 0; j < sorted2.length; j++) {
            if (i !== j && sorted1[i] === sorted2[j]) {
                score += 1; // 異なる指位置での同じ音：低いスコア
            }
        }
    }
    
    return score;
}

// 2つのコード間の共通音数を計算（後方互換性のため残す）
function countCommonNotes(chord1, chord2) {
    if (!chord1 || !chord2) return 0;
    
    const midi1 = chord1.map(noteToMidiNumber).filter(n => n !== null);
    const midi2 = chord2.map(noteToMidiNumber).filter(n => n !== null);
    
    return midi1.filter(note1 => midi2.includes(note1)).length;
}

// コードの演奏しやすさスコアを計算（音域ペナルティ込み）
function calculatePlayabilityScore(chord) {
    const span = calculateSpan(chord);
    
    // 理想的な音域は1オクターブ（12半音）程度
    // 1.5オクターブ（18半音）を超えると急激にペナルティ
    const idealSpan = 12;
    const maxComfortableSpan = 18;
    
    if (span <= idealSpan) {
        return 0; // ボーナスなし、ペナルティなし
    } else if (span <= maxComfortableSpan) {
        // 線形にペナルティを増加
        return -((span - idealSpan) * 0.5);
    } else {
        // 1.5オクターブを超えたら大きなペナルティ
        return -(maxComfortableSpan - idealSpan) * 0.5 - (span - maxComfortableSpan) * 2;
    }
}

// 2つのコード間で動かす必要がある指（指位置ベース）を特定
function getChangedNotes(prevChord, currentChord) {
    if (!prevChord) return { added: currentChord || [], removed: [] };
    if (!currentChord) return { added: [], removed: prevChord || [] };
    
    // 指位置でソート（低い音から順番）
    const prevSorted = prevChord.map(note => ({ note, midi: noteToMidiNumber(note) }))
        .filter(item => item.midi !== null)
        .sort((a, b) => a.midi - b.midi);
    
    const currSorted = currentChord.map(note => ({ note, midi: noteToMidiNumber(note) }))
        .filter(item => item.midi !== null)
        .sort((a, b) => a.midi - b.midi);
    
    const added = [];
    
    // 指位置ごとに比較して、変化した音を特定
    const maxLength = Math.max(prevSorted.length, currSorted.length);
    for (let i = 0; i < maxLength; i++) {
        const prevNote = i < prevSorted.length ? prevSorted[i] : null;
        const currNote = i < currSorted.length ? currSorted[i] : null;
        
        // 指位置での音が変化した場合
        if (!prevNote && currNote) {
            added.push(currNote.note); // 新しい指位置
        } else if (prevNote && currNote && prevNote.midi !== currNote.midi) {
            added.push(currNote.note); // 既存の指位置で音が変化
        }
    }
    
    return { added, removed: [] }; // 動かす必要がある音のみ赤く表示
}

// 運指を考慮した最適な転回形シーケンスを選択
function selectOptimalVoicings(chordData) {
    if (chordData.length === 0) return [];
    
    const chordsWithInversions = chordData.map(data => ({
        name: data.name,
        chordType: data.chord,
        inversions: generateAllInversions(parseRootNote(data.name), parseChordType(data.name))
    }));
    
    if (chordsWithInversions.length === 1) {
        return [{
            name: chordsWithInversions[0].name,
            chord: chordsWithInversions[0].chordType,
            notes: chordsWithInversions[0].inversions[0]
        }];
    }
    
    // 動的プログラミングで最適解を求める
    const dp = [];
    const parent = [];
    
    // 初期化（最初のコードには演奏しやすさスコアのみ適用）
    dp[0] = chordsWithInversions[0].inversions.map(inv => calculatePlayabilityScore(inv));
    parent[0] = chordsWithInversions[0].inversions.map(() => -1);
    
    // DPテーブル構築
    for (let i = 1; i < chordsWithInversions.length; i++) {
        dp[i] = [];
        parent[i] = [];
        
        for (let j = 0; j < chordsWithInversions[i].inversions.length; j++) {
            let maxScore = -1;
            let bestPrev = -1;
            
            for (let k = 0; k < chordsWithInversions[i-1].inversions.length; k++) {
                const fingerPositionScore = calculateFingerPositionScore(
                    chordsWithInversions[i-1].inversions[k],
                    chordsWithInversions[i].inversions[j]
                );
                const playabilityScore = calculatePlayabilityScore(chordsWithInversions[i].inversions[j]);
                const score = dp[i-1][k] + fingerPositionScore + playabilityScore;
                
                if (score > maxScore) {
                    maxScore = score;
                    bestPrev = k;
                }
            }
            
            dp[i][j] = maxScore;
            parent[i][j] = bestPrev;
        }
    }
    
    // 最適解をバックトラック
    const lastChordIndex = chordsWithInversions.length - 1;
    let bestLastInversion = 0;
    let maxFinalScore = dp[lastChordIndex][0];
    
    for (let j = 1; j < dp[lastChordIndex].length; j++) {
        if (dp[lastChordIndex][j] > maxFinalScore) {
            maxFinalScore = dp[lastChordIndex][j];
            bestLastInversion = j;
        }
    }
    
    // 結果を構築
    const result = [];
    const selectedInversions = [];
    
    let currentInversion = bestLastInversion;
    for (let i = lastChordIndex; i >= 0; i--) {
        selectedInversions[i] = currentInversion;
        if (i > 0) {
            currentInversion = parent[i][currentInversion];
        }
    }
    
    for (let i = 0; i < chordsWithInversions.length; i++) {
        const inversionIndex = selectedInversions[i];
        result.push({
            name: chordsWithInversions[i].name,
            chord: chordsWithInversions[i].chordType,
            notes: chordsWithInversions[i].inversions[inversionIndex]
        });
    }
    
    return result;
}

// ピアノ伴奏用ボイシングを生成（C#2-D#3範囲制限、C2-E3表示）
function generatePianoVoicing(rootNote, chordType) {
    return generateBasicVoicing(rootNote, chordType);
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
                description: notes.map(note => sharpToFlat(note.replace(/\d/, ''))).join(' - ')
            };
        }
    });
    
    return result;
}

// ジャズピアノコードの定義（動的生成）
const jazzChords = generateJazzChords();

// DOM要素の取得
const chordInput = document.getElementById('chord-input');
const pianoKeys = document.querySelectorAll('.key');


// 全ての鍵盤をリセット
function resetPiano() {
    pianoKeys.forEach(key => {
        key.classList.remove('active');
    });
}

// ツーファイブワンパターンを検出してaltコードに変換
function applyAlteredChords(chords) {
    const result = [...chords];
    
    // ツーファイブワン（3コード）のパターンをチェック
    for (let i = 0; i < result.length - 2; i++) {
        const chord1 = result[i];     // ツー（マイナー7th）
        const chord2 = result[i + 1]; // ファイブ（ドミナント7th）
        const chord3 = result[i + 2]; // ワン（マイナー）
        
        // ツーファイブワンのパターン判定
        const isTwo = chord1.includes('m7') && !chord1.includes('M7');
        const isFive = chord2.endsWith('7') && 
                      !chord2.includes('M7') && 
                      !chord2.includes('m7') &&
                      !chord2.includes('m7b5') &&
                      !chord2.includes('dim7');
        const isOne = chord3.includes('m7') || (chord3.includes('m') && !chord3.includes('M'));
        
        if (isTwo && isFive && isOne) {
            // ファイブ（中央のコード）をaltに置換
            result[i + 1] = chord2.replace('7', 'alt');
        }
    }
    
    return result;
}

// 複数コードの入力を処理（改行とカンマ区切り対応）
function processMultipleChords(input) {
    const chordContainer = document.getElementById('piano-container');
    chordContainer.innerHTML = ''; // 既存のピアノをクリア
    
    if (!input) {
        return;
    }
    
    // 改行ごとに分割し、各行をカンマ区切りで処理
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
        return;
    }
    
    const allValidChords = [];
    
    lines.forEach((line, lineIndex) => {
        // 各行をカンマ区切りで分割
        let chords = line.split(',').map(chord => chord.trim()).filter(chord => chord);
        
        // オルタードコード変換を適用
        chords = applyAlteredChords(chords);
        
        const lineValidChords = [];
        
        chords.forEach(chordKey => {
            const chord = generateChordFromInput(chordKey);
            if (chord) {
                lineValidChords.push({ name: chordKey, chord: chord });
            }
        });
        
        if (lineValidChords.length > 0) {
            // 運指を考慮した最適な転回形を選択
            const optimizedChords = selectOptimalVoicings(lineValidChords);
            
            allValidChords.push({ line: lineIndex, chords: optimizedChords });
        }
    });
    
    if (allValidChords.length === 0) {
        return;
    }
    
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
        description: notes.map(note => sharpToFlat(note.replace(/\d/, ''))).join(' - ')
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
        
        // 前のコードとの変化を計算
        const prevChord = chordIndex > 0 ? chords[chordIndex - 1].notes : null;
        const changedNotes = getChangedNotes(prevChord, chordData.notes);
        
        // 個別のピアノラッパーを作成
        const pianoWrapper = document.createElement('div');
        pianoWrapper.className = 'piano-wrapper';
        pianoWrapper.innerHTML = `
            <div class="chord-label">
                <h3>${chordData.name}</h3>
                <p>${chordData.notes.map(note => sharpToFlat(note.replace(/\d/, ''))).join(' - ')}</p>
            </div>
            <div class="piano" id="piano-${uniqueId}">
                <!-- C2-E3 range display, C#2-D#3 range for voicing calculation -->
                <div class="key white" data-note="C2" data-piano="${uniqueId}">
                    <span class="note-label">C</span>
                </div>
                <div class="key black" data-note="C#2" data-piano="${uniqueId}">
                    <span class="note-label">Db</span>
                </div>
                <div class="key white" data-note="D2" data-piano="${uniqueId}">
                    <span class="note-label">D</span>
                </div>
                <div class="key black" data-note="D#2" data-piano="${uniqueId}">
                    <span class="note-label">Eb</span>
                </div>
                <div class="key white" data-note="E2" data-piano="${uniqueId}">
                    <span class="note-label">E</span>
                </div>
                <div class="key white" data-note="F2" data-piano="${uniqueId}">
                    <span class="note-label">F</span>
                </div>
                <div class="key black" data-note="F#2" data-piano="${uniqueId}">
                    <span class="note-label">Gb</span>
                </div>
                <div class="key white" data-note="G2" data-piano="${uniqueId}">
                    <span class="note-label">G</span>
                </div>
                <div class="key black" data-note="G#2" data-piano="${uniqueId}">
                    <span class="note-label">Ab</span>
                </div>
                <div class="key white" data-note="A2" data-piano="${uniqueId}">
                    <span class="note-label">A</span>
                </div>
                <div class="key black" data-note="A#2" data-piano="${uniqueId}">
                    <span class="note-label">Bb</span>
                </div>
                <div class="key white" data-note="B2" data-piano="${uniqueId}">
                    <span class="note-label">B</span>
                </div>
                <div class="key white" data-note="C3" data-piano="${uniqueId}">
                    <span class="note-label">C</span>
                </div>
                <div class="key black" data-note="C#3" data-piano="${uniqueId}">
                    <span class="note-label">Db</span>
                </div>
                <div class="key white" data-note="D3" data-piano="${uniqueId}">
                    <span class="note-label">D</span>
                </div>
                <div class="key black" data-note="D#3" data-piano="${uniqueId}">
                    <span class="note-label">Eb</span>
                </div>
                <div class="key white" data-note="E3" data-piano="${uniqueId}">
                    <span class="note-label">E</span>
                </div>
            </div>
        `;
        
        rowPianoContainer.appendChild(pianoWrapper);
        
        // このピアノの鍵盤をハイライト
        chordData.notes.forEach(note => {
            const key = pianoWrapper.querySelector(`[data-note="${note}"][data-piano="${uniqueId}"]`);
            if (key) {
                key.classList.add('active');
                
                // 前のコードから変化した音は赤くハイライト
                if (changedNotes.added.includes(note)) {
                    key.classList.add('changed');
                }
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

// 簡易入力ボタンの機能
function initializeInputButtons() {
    const inputButtons = document.querySelectorAll('.input-btn');
    
    inputButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const value = button.getAttribute('data-value');
            const action = button.getAttribute('data-action');
            const preset = button.getAttribute('data-preset');
            
            // カーソル位置を取得
            const cursorPos = chordInput.selectionStart;
            const currentValue = chordInput.value;
            
            let newValue = currentValue;
            let newCursorPos = cursorPos;
            
            if (preset) {
                // プリセットコード進行の挿入
                switch(preset) {
                    case 'autumn':
                        const autumnLeaves = `Cm7, F7, BbM7, EbM7
Adim7, D7, Gm7, Gm7
Adim7, D7, Gm7, Gm7
Cm7, F7, BbM7, EbM7
Adim7, D7, Gm7, GbM7, Fm7, E7
Adim7, D7, Gm7, Gm7`;
                        newValue = autumnLeaves;
                        newCursorPos = autumnLeaves.length;
                        break;
                }
            } else if (value) {
                // 音名・記号・コードタイプの挿入
                newValue = currentValue.slice(0, cursorPos) + value + currentValue.slice(cursorPos);
                newCursorPos = cursorPos + value.length;
            } else if (action) {
                // アクション系ボタン
                switch(action) {
                    case 'space':
                        newValue = currentValue.slice(0, cursorPos) + ' ' + currentValue.slice(cursorPos);
                        newCursorPos = cursorPos + 1;
                        break;
                    case 'comma':
                        newValue = currentValue.slice(0, cursorPos) + ', ' + currentValue.slice(cursorPos);
                        newCursorPos = cursorPos + 2;
                        break;
                    case 'newline':
                        newValue = currentValue.slice(0, cursorPos) + '\n' + currentValue.slice(cursorPos);
                        newCursorPos = cursorPos + 1;
                        break;
                }
            }
            
            // テキストエリアを更新
            chordInput.value = newValue;
            chordInput.setSelectionRange(newCursorPos, newCursorPos);
            chordInput.focus();
            
            // コード表示を更新
            processMultipleChords(newValue);
        });
    });
}

// イベントリスナーの設定
chordInput.addEventListener('input', (event) => {
    const inputValue = event.target.value.trim();
    processMultipleChords(inputValue);
});

chordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const inputValue = event.target.value.trim();
        processMultipleChords(inputValue);
    }
});

// 各鍵盤にクリックイベントを追加
pianoKeys.forEach(key => {
    key.addEventListener('click', handleKeyClick);
});

// 初期化
initializeInputButtons();
resetPiano();
// 初期状態では空の状態から開始
if (chordInput.value.trim()) {
    processMultipleChords(chordInput.value);
}


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