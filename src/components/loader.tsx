import React from "react";
import style from "../style/loader.module.css";

type LoaderProps = {
  text: string;
  progress: string;
};

const Loader: React.FC<LoaderProps> = ({ text, progress }) => {
  const progressValue = isNaN(parseFloat(progress)) ? 0 : parseFloat(progress);
  const roundedProgress = Math.round(progressValue);
  
  return (
    <div className={style.body}>
      <div className={style.content}>
        <img src="/LogoAdox.png" alt="Logo de ADOX" />
        <p className={style.title}>Lavado de manos</p>
        <p className={style.text}>{text}</p>
  
        {/* Contenedor de la barra de progreso */}
        <div className={style.progressContainer}>
          <p className={style.progressText}>{`${progressValue.toFixed(2)}%`}</p>
          <div className={style.progressBar}>
            <div
              className={style.progressFill}
              style={{ width: `${roundedProgress}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;