from . import db
from werkzeug.security import generate_password_hash, check_password_hash

# Association table for many-to-many relationship between users (friends/contacts)
user_contacts = db.Table('user_contacts',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('contact_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    accounts = db.relationship('Account', backref='user', lazy=True)
    contacts = db.relationship('User', secondary=user_contacts,
                               primaryjoin=id == user_contacts.c.user_id,
                               secondaryjoin=id == user_contacts.c.contact_id,
                               backref='user_contacts', lazy='dynamic')

    def __repr__(self) -> str:
        return f'<User {self.email}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    balance = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self) -> str:
        return f'<Account {self.type} - {self.balance}>'
