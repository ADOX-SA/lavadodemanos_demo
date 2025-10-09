'use client';
import { useTheme } from '@adoxdesarrollos/designsystem-2';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  useTheme();

  return (
    <nav className={styles.navbarContainer}>
        <div className={styles.contentDesktop}>
            <div className={styles.logoMenu}>
                <Link href={'/'}>
                    <Image src='/LogoAdox/logo_LavIA_navbar.png' width={130} height={30} alt={'logo navbar'} />
                </Link>
            </div>
      </div>
        <div>
            ADOX S.A.
        </div>
    </nav>
  );
};

export default Navbar;