from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import os
from classes.classes import Cola

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    temp_path = 'temp_audio.wav'
    audio_file.save(temp_path)

    recognizer = sr.Recognizer()
    with sr.AudioFile(temp_path) as source:
        audio = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio, language="es-ES")  
        except sr.UnknownValueError:
            text = "Could not understand the audio"
        except sr.RequestError as e:
            text = f"Error with speech recognition service: {e}"

    os.remove(temp_path)
    return jsonify({'text': text})

@app.route('/cola', methods=['GET'])
def obtener_cola():
    return jsonify({'cola': Cola.items[::-1]})  

@app.route('/cola', methods=['POST'])
def encolar():
    data = request.get_json()
    item = data.get('item')
    if item:
        Cola.encolar(item)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'No item provided'}), 400

@app.route('/cola', methods=['DELETE'])
def desencolar():
    if not Cola.is_empty():
        desencolado = Cola.desencolar()
        return jsonify({'success': True, 'item': desencolado})
    return jsonify({'success': False, 'error': 'Cola vacía'}), 400

if __name__ == '__main__':
    app.run(debug=True)