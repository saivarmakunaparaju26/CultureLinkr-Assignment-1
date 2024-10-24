import {Component} from 'react'
import './App.css'

class App extends Component {
  state = {
    username: '',
    email: '',
    message: '',
    error: '',
    success: false,
    n: '',
    mess: '',
  }

//To get the name value
  getName = event => {
    this.setState({username: event.target.value})
  }

//To get the email value
  getEmail = event => {
    this.setState({email: event.target.value})
  }

//To get the message value
  getMessage = event => {
    this.setState({message: event.target.value})
  }

//To submit the form and to check whether the user entered details like name, email, message and to check if the email is right format like @gmail.com
  displayMessage = event => {
    event.preventDefault()
    const {username, email, message} = this.state
    const len = email.length
    const ifContains = email.slice(len - 10, len)
    if (username === '') {
      this.setState({error: 'please enter a name', mess: ''})
    } else if (email === '') {
      this.setState({error: 'please enter email id', mess: ''})
    } else if (ifContains !== '@gmail.com') {
      this.setState({error: 'please enter a valid email id', mess: ''})
    } else if (message === '') {
      this.setState({error: 'please enter a message', mess: ''})
    }

    if (
      username !== '' &&
      email !== '' &&
      ifContains === '@gmail.com' &&
      message !== ''
    ) {
      this.setState(
        {
          error: '',
          success: true,
          n: username,
          username: '',
          email: '',
          message: '',
        },
        this.getThemess,
      )
    }
  }

  getThemess = () => {
    const {n} = this.state
    this.setState({
      mess: `${n} your message has been sent successfully`,
    })
  }

  render() {
    const {error, success, mess, username, email, message} = this.state
    return (
      <div className="main-container">
        <div className="form-container">
          <form onSubmit={this.displayMessage} className="form">
            <label htmlFor="name" className="name">
              NAME
            </label>
            <input
              type="text"
              id="name"
              value={username}
              placeholder=" Enter Your Name"
              onChange={this.getName}
              className="u"
            />
            <label htmlFor="email" className="name">
              Email
            </label>
            <input
              type="text"
              id="email"
              value={email}
              placeholder=" Enter Your Email"
              onChange={this.getEmail}
              className="u"
            />
            <label htmlFor="message" className="name">
              Message
            </label>
            <textarea
              rows="10"
              cols="50"
              onChange={this.getMessage}
              placeholder=" Write your message"
              value={message}
              className="me"
            ></textarea>
            <div className="button-container">
              <button type="submit" className="button">
                Submit
              </button>
            </div>
          </form>
          {success ? (
            <p className="green">{mess}</p>
          ) : (
            <p className="p">{error}</p>
          )}
        </div>
      </div>
    )
  }
}

export default App
