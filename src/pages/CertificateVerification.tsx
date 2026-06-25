import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, BadgeCheck, ExternalLink, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import { fetchCertificateVerification, type PublicCertificateVerification } from '@/lib/auth';

const CertificateVerification: React.FC = () => {
  const { certificateNumber = '' } = useParams();
  const [certificate, setCertificate] = useState<PublicCertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchCertificateVerification(certificateNumber)
      .then((result) => {
        if (isMounted) setCertificate(result);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Certificate could not be verified.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [certificateNumber]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />

      <main className="py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <section className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 text-primary font-semibold mb-4">
              <ShieldCheck size={18} />
              Certificate Verification
            </div>

            {isLoading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
                Checking certificate record...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-card p-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Certificate not verified</h1>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : certificate ? (
              <div className="rounded-lg border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Award size={26} />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          Verified Tribe Block Credential
                        </h1>
                        <p className="text-muted-foreground">Issued by Tribe Block University</p>
                      </div>
                    </div>

                    <p className="text-lg text-muted-foreground">
                      {certificate.user.displayName} completed <span className="font-semibold text-foreground">{certificate.course.title}</span>.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                    <BadgeCheck size={16} />
                    {certificate.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <Info label="Certificate Number" value={certificate.certificateNumber} />
                  <Info label="Student Handle" value={`@${certificate.user.handle}`} />
                  <Info label="Course" value={certificate.course.title} />
                  <Info label="Chain ID" value={certificate.nftChainId?.toString() ?? 'Pending mint'} />
                  <Info label="NFT Contract" value={certificate.nftContract ?? 'Pending mint'} />
                  <Info label="NFT Token ID" value={certificate.nftTokenId ?? 'Pending mint'} />
                  <Info label="Transaction Hash" value={certificate.transactionHash ?? 'Pending mint'} wide />
                  <Info label="Issued At" value={certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleString() : 'Pending'} />
                </div>

                <div className="flex flex-wrap gap-3 mt-8">
                  {certificate.metadataUri && (
                    <a href={certificate.metadataUri} className="btn-primary inline-flex items-center gap-2 px-5 py-3">
                      Metadata
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <Link to={`/course/${certificate.course.slug}`} className="btn-secondary border border-border inline-flex px-5 py-3">
                    View Course
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

const Info = ({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) => (
  <div className={`rounded-md bg-secondary/70 p-4 ${wide ? 'md:col-span-2' : ''}`}>
    <p className="text-xs uppercase text-muted-foreground mb-1">{label}</p>
    <p className="break-all font-semibold text-foreground">{value}</p>
  </div>
);

export default CertificateVerification;
