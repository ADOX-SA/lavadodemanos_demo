export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const soundSuccess = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio('/sounds/success2.mp3');
        audio.play()
        .then(() => resolve())
        .catch(error => {
            console.error('Error al reproducir el sonido:', error);
            reject(error);
        });
    });
};

export const soundNotificacion = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio('/sounds/notificacion.mp3');
        audio.play()
        .then(() => resolve())
        .catch(error => {
            console.error('Error al reproducir el sonido:', error);
            reject(error);
        });
    });
};