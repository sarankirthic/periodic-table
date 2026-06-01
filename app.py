from flask import Flask, render_template, abort

app = Flask(__name__)

_SECTIONS = {
    'organic': {
        'title': 'Organic Chemistry',
        'joke': 'Organic chemistry is difficult. Those who study it have alkynes of problems.',
    },
    'inorganic': {
        'title': 'Inorganic Chemistry',
        'joke': 'I told an inorganic chemist a joke. No reaction.',
    },
    'physical': {
        'title': 'Physical Chemistry',
        'joke': "Physical chemistry: where the maths comes to make chemistry students cry, and the chemistry comes to make physicists weep.",
    },
}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/<section>')
def coming_soon(section):
    if section not in _SECTIONS:
        abort(404)
    return render_template('coming_soon.html', **_SECTIONS[section])


if __name__ == '__main__':
    app.run(debug=True)
