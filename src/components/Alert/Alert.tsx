import React from "react";
import style from "./Alert.module.css";

interface AlertProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const Alert: React.FC<AlertProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className={style.overlay}>
        <div className={style.alertBox}>
            <h2>¿Desea iniciar el lavado de manos?</h2>
            <div className={style.buttonContainer}>
            <button className={style.confirm} onClick={onConfirm}>Sí</button>
            <button className={style.cancel} onClick={onCancel}>No</button>
            </div>
        </div>
        </div>
    );
};

export default Alert;
