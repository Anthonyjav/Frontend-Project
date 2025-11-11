// components/WhatsappBubble.tsx
import { useEffect, useState } from 'react';
import styles from './WhatsappBubble.module.css';

const WhatsappBubble = () => {
  const [isActive, setIsActive] = useState(false);

  const togglePopup = () => {
    setIsActive(!isActive);
  };

  useEffect(() => {
    // Reiniciar animación del ícono si se cierra
    const icon = document.getElementById('whatsappIcon');
    if (!isActive && icon) {
      icon.classList.remove(styles.rotate);
      void icon.offsetWidth;
      icon.classList.add(styles.rotate);
    }
  }, [isActive]);

  return (
    <div className={styles.whatsappBubble} onClick={togglePopup}>
      <img
        id="whatsappIcon"
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        className={styles.icon}
        style={{ opacity: isActive ? 0 : 1 }}
      />
      <svg
        id="closeIcon"
        className={`${styles.closeIcon} ${isActive ? styles.active : ''}`}
        width="40"
        height="40"
        viewBox="0 0 40 40"
      >
        <line className={`${styles.line1} ${isActive ? styles.drawLine : ''}`} x1="10" y1="10" x2="30" y2="30" />
        <line className={`${styles.line2} ${isActive ? styles.drawLine : ''}`} x1="30" y1="10" x2="10" y2="30" />
      </svg>

      <div className={`${styles.popup} ${isActive ? styles.active : ''}`}>
        <div className={styles.popupTop}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className={styles.popupIcon}
          />
          <div className={styles.popupTexts}>
            <span className={styles.popupText}>Comuníquese por WhatsApp</span>
            <span className={styles.bottomText}>Haga click en el número para hablar por WhatsApp</span>
          </div>
        </div>
        <div className={styles.popupBottom}>
          <a
            href="https://wa.me/51944105915?text=Hola%20me%20gustaría%20más%20información"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.popupContact}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
              alt="WhatsApp"
              className={styles.popupIconSmall}
            />
            <div className={styles.popupContactInfo}>
              <span className={styles.contactName}>Atención al cliente</span>
              <span className={styles.contactNumber}>+51 944 105 915</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default WhatsappBubble;
