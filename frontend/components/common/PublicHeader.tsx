import Link from 'next/link';

export default function PublicHeader() {
    return (
        <header className="w-full bg-white py-2 flex justify-center">
            <Link href="/">
                <img src="/headerlogo.png" alt="Amrita Events Logo" className="h-12 md:h-14 object-contain hover:opacity-90 transition-opacity" />
            </Link>
        </header>
    );
}
