import React from "react";
import styles from './Heade.module.scss'

function Header() {
    return (
        <header>
                <img className={styles.logo} src="./img/test_logo.svg" alt="Logo" />
                <nav className={styles.navbar}>
                    <ul>
                    <li><a href="#">Overview</a></li>
                    <li><a href="#">Features</a></li>
                    <li><a href="#">Pricing</a></li>
                    <li><a href="#">About</a></li>
                    </ul>
                </nav>
                    <div className="Auth">
                        <div className={styles.signUp}>
                            <button>Sign Up</button>
                        </div>
                        <div className={styles.signIn}>
                            <button>Sign In</button>
                        </div>
                    </div>
        </header>
    );
}

export default Header;