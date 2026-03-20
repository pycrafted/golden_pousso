import { useState } from 'react';

const UserForm = ({ isOpen, onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPass, setShowPass] = useState({});

  const togglePassword = (id) => {
    setShowPass((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const switchToSignup = () => {
    setIsSignup(true);
    document.querySelector(':root').style.setProperty('--custom', '#ff0066');
  };

  const switchToLogin = () => {
    setIsSignup(false);
    document.querySelector(':root').style.setProperty('--custom', '#1a1aff');
  };

  return (
    <div className={`user-form${isOpen ? ' show' : ''}${isSignup ? ' active' : ''}`}>
      <div className="close-form d-flex" onClick={onClose}>
        <i className="bx bx-x"></i>
      </div>
      <div className={`form-wrapper container${isSignup ? ' active' : ''}`}>
        {/* Login */}
        <div className="user login">
          <div className="img-box">
            <img src="/images/login.svg" alt="" />
          </div>
          <div className="form-box">
            <div className="top">
              <p>
                Not a member?{' '}
                <span onClick={switchToSignup}>Register now</span>
              </p>
            </div>
            <form action="">
              <div className="form-control">
                <h2>Hello Again!</h2>
                <p>Welcome back you've been missed.</p>
                <input type="text" placeholder="Enter Username" />
                <div>
                  <input
                    type={showPass['login'] ? 'text' : 'password'}
                    placeholder="Password"
                  />
                  <div className="icon form-icon" onClick={() => togglePassword('login')}>
                    <img src={showPass['login'] ? '/images/hide.svg' : '/images/eye.svg'} alt="" />
                  </div>
                </div>
                <span>Recovery Password</span>
                <input type="Submit" defaultValue="Login" />
              </div>
              <div className="form-control">
                <p>Or continue with</p>
                <div className="icons">
                  <div className="icon"><img src="/images/search.svg" alt="" /></div>
                  <div className="icon"><img src="/images/apple.svg" alt="" /></div>
                  <div className="icon"><img src="/images/facebook.svg" alt="" /></div>
                  <div className="icon"><img src="/images/github.svg" alt="" /></div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Signup */}
        <div className="user signup">
          <div className="form-box">
            <div className="top">
              <p>
                Already a member?{' '}
                <span onClick={switchToLogin}>Login now</span>
              </p>
            </div>
            <form action="">
              <div className="form-control">
                <h2>Welcome Codevo!</h2>
                <p>It's good to have you.</p>
                <input type="email" placeholder="Enter Email" />
                <div>
                  <input
                    type={showPass['signup1'] ? 'text' : 'password'}
                    placeholder="Password"
                  />
                  <div className="icon form-icon" onClick={() => togglePassword('signup1')}>
                    <img src={showPass['signup1'] ? '/images/hide.svg' : '/images/eye.svg'} alt="" />
                  </div>
                </div>
                <div>
                  <input
                    type={showPass['signup2'] ? 'text' : 'password'}
                    placeholder="Confirm Password"
                  />
                  <div className="icon form-icon" onClick={() => togglePassword('signup2')}>
                    <img src={showPass['signup2'] ? '/images/hide.svg' : '/images/eye.svg'} alt="" />
                  </div>
                </div>
                <input type="Submit" defaultValue="Register" />
              </div>
              <div className="form-control">
                <p>Or continue with</p>
                <div className="icons">
                  <div className="icon"><img src="/images/search.svg" alt="" /></div>
                  <div className="icon"><img src="/images/apple.svg" alt="" /></div>
                  <div className="icon"><img src="/images/facebook.svg" alt="" /></div>
                  <div className="icon"><img src="/images/github.svg" alt="" /></div>
                </div>
              </div>
            </form>
          </div>
          <div className="img-box">
            <img src="/images/trial.svg" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
