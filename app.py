from flask import Flask, request, send_file, render_template
from gtts import gTTS
import uuid
import os

app = Flask(__name__)

AUDIO_DIR = "audio_cache"
os.makedirs(AUDIO_DIR, exist_ok=True)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/convert", methods=["POST"])
def convert():
    text = request.json.get("text", "").strip()

    if not text:
        return {"error": "No text provided"}, 400

    filename = f"speech_{uuid.uuid4().hex[:6]}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    tts = gTTS(text=text, lang="en")
    tts.save(filepath)

    # as_attachment=False -> browser streams it, so our <audio> element
    # can actually play it instead of just downloading it
    return send_file(filepath, mimetype="audio/mpeg", as_attachment=False)


if __name__ == "__main__":
    app.run(debug=True)