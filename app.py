from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route('/models/<path:filename>')
def serve_models(filename):
    return send_from_directory('models', filename)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
